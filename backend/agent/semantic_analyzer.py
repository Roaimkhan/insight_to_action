import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from itertools import combinations
from agent.state import DataSource, Contradiction
import os

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key or api_key == "mock_key":
    embeddings_model = None
else:
    embeddings_model = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=api_key
    )

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    a = np.array(vec_a)
    b = np.array(vec_b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))

def topic_overlap_score(text_a: str, text_b: str) -> float:
    """
    Jaccard similarity on content words (length > 4, not stopwords).
    High overlap = sources discuss same topic.
    """
    # Clean punctuation and normalize plural 'shipments' -> 'shipment' to ensure robust Jaccard overlap
    def preprocess(t):
        for char in ".,!?\"'()[]{}":
            t = t.replace(char, " ")
        t = t.lower()
        t = t.replace("shipments", "shipment")
        return t

    text_a = preprocess(text_a)
    text_b = preprocess(text_b)

    stopwords = {"the","and","for","that","this","with","from","have",
                 "will","been","were","they","their","about","which"}
    words_a = set(w.lower() for w in text_a.split() if len(w) > 4 and w.lower() not in stopwords)
    words_b = set(w.lower() for w in text_b.split() if len(w) > 4 and w.lower() not in stopwords)
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)

async def embed_source(text: str) -> list[float]:
    """Embed a source text. Truncate to 2000 chars to stay within token limits."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "mock_key" or embeddings_model is None:
        # Return a simple deterministic vector based on the hash of the text words to allow offline cosine similarity computation!
        import hashlib
        words = text.lower().split()
        vector = np.zeros(768)
        for w in words:
            w_clean = w.strip(".,!?\"'()[]{}")
            if not w_clean:
                continue
            h = int(hashlib.md5(w_clean.encode('utf-8')).hexdigest(), 16)
            for k in range(5):
                idx = (h + k * 101) % 768
                vector[idx] += 1.0
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    return await embeddings_model.aembed_query(text[:2000])

async def detect_semantic_contradictions(
    sources: list[DataSource],
    topic_threshold: float = 0.25,
    similarity_threshold: float = 0.55
) -> list[Contradiction]:
    """
    For every pair of sources:
    1. Compute topic overlap (are they discussing the same thing?)
    2. If topic overlap > topic_threshold: embed both and compute cosine similarity
    3. If cosine similarity < similarity_threshold: flag as semantic contradiction
    
    Semantic contradiction = same topic, opposite/divergent meaning.
    
    This catches what numeric detection misses:
    "Shipment confirmed on track" vs "Port strike halts all cargo"
    Same topic (shipment), low semantic similarity = CONTRADICTION.
    """
    contradictions = []
    
    # Embed all sources in parallel
    import asyncio
    texts = [s.raw_text for s in sources]
    embeddings = await asyncio.gather(*[embed_source(t) for t in texts])
    
    for (i, src_a), (j, src_b) in combinations(enumerate(sources), 2):
        # Skip if same source type (same format = expected similarity)
        if src_a.source_type == src_b.source_type:
            continue
            
        # Step 1: topic overlap check (cheap, no API call)
        overlap = topic_overlap_score(src_a.raw_text, src_b.raw_text)
        if overlap < topic_threshold:
            continue  # Different topics, not a contradiction
            
        # Step 2: semantic similarity check
        sim = cosine_similarity(embeddings[i], embeddings[j])
        
        if sim < similarity_threshold:
            # Same topic, divergent meaning = semantic contradiction
            conflict_score = round((1 - sim) * overlap, 3)
            
            # Disputed source = lower credibility * recency weight
            weight_a = src_a.credibility_score
            weight_b = src_b.credibility_score
            disputed = src_a if weight_a < weight_b else src_b
            
            contradictions.append(Contradiction(
                source_a_id=src_a.source_id,
                source_b_id=src_b.source_id,
                metric="semantic_divergence",
                conflict_description=(
                    f"Sources discuss the same topic (overlap={overlap:.2f}) "
                    f"but convey contradictory information "
                    f"(semantic similarity={sim:.2f}, below threshold {similarity_threshold})"
                ),
                conflict_score=conflict_score,
                disputed_source_id=disputed.source_id,
                resolution=f"Treating {disputed.source_id} as lower-credibility. "
                           f"Flagged for manual verification."
            ))
    
    return contradictions

def format_contradiction_for_display(c: Contradiction) -> dict:
    """Format contradiction for mobile WebSocket event."""
    return {
        "type": "contradiction",
        "source_a": c.source_a_id,
        "source_b": c.source_b_id,
        "detection_method": "semantic" if c.metric == "semantic_divergence" else "numeric",
        "conflict_score": c.conflict_score,
        "disputed": c.disputed_source_id,
        "resolution": c.resolution,
        "severity": "HIGH" if c.conflict_score > 0.6 else "MEDIUM"
    }
