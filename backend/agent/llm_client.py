import instructor
import google.generativeai as genai
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import os
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY") or "mock_key")

# Wrap Gemini with instructor for schema-enforced outputs
gemini_model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
client = instructor.from_gemini(gemini_model, mode=instructor.Mode.GEMINI_JSON)

# Strict Pydantic output schemas — LLM must conform to these exactly

class InsightItem(BaseModel):
    title: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_source_ids: list[str]
    
    @field_validator('confidence')
    @classmethod
    def round_confidence(cls, v):
        return round(v, 2)

class ContradictionItem(BaseModel):
    source_a_id: str
    source_b_id: str
    metric: str
    conflict_description: str
    conflict_score: float = Field(ge=0.0, le=1.0)
    disputed_source_id: str
    resolution: str

class AnalysisResult(BaseModel):
    insights: list[InsightItem] = Field(min_length=1, max_length=5)
    risks: list[str]
    opportunities: list[str]
    contradictions: list[ContradictionItem]
    urgency_score: float = Field(ge=0.0, le=10.0)
    domain_detected: str
    summary: str

class ActionItem(BaseModel):
    action_id: str
    action_type: str
    description: str
    parameters: dict
    constraints: dict
    confidence: float = Field(ge=0.0, le=1.0)
    urgency: float = Field(ge=0.0, le=1.0)
    impact: float = Field(ge=0.0, le=1.0)
    priority_score: float = Field(ge=0.0, le=1.0)
    reasoning: str
    fallback_action: Optional[dict] = None
    triggered_by: Optional[str] = None

class PlanResult(BaseModel):
    action_chain: list[ActionItem] = Field(min_length=1, max_length=5)
    plan_confidence: float = Field(ge=0.0, le=1.0)
    plan_summary: str

class SelfHealDecision(BaseModel):
    decision: str = Field(pattern="^(retry|fallback|rollback)$")
    modified_parameters: dict = {}
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)

def call_llm_structured(prompt: str, response_model, max_retries: int = 3):
    """
    Call Gemini with instructor. Automatically retries and self-corrects
    if output does not match the Pydantic schema.
    If no active API key is set, returns a simulated high-fidelity response.
    Raises instructor.exceptions.InstructorRetryException after max_retries.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key or api_key == "mock_key":
        # Return high-fidelity mock objects for offline testing to match original resilient responder pattern
        if response_model == AnalysisResult:
            return AnalysisResult(
                insights=[
                    InsightItem(
                        title="Valve inventory levels are depleted.",
                        description="Valves & Actuators Ltd halted operations, leading to stockouts.",
                        confidence=0.90,
                        evidence_source_ids=["SRC-CSV"]
                    )
                ],
                risks=["Stockout of compressor valves."],
                opportunities=["Replenish bearings."],
                contradictions=[
                    ContradictionItem(
                        source_a_id="SRC-REALTIME",
                        source_b_id="SRC-CSV",
                        metric="complaint_count",
                        conflict_description="Weekly reports say 10 complaints, realtime streams show 120 complaints.",
                        conflict_score=0.85,
                        disputed_source_id="SRC-CSV",
                        resolution="Prioritized live customer complaints over stale weekly CSV reports."
                    )
                ],
                urgency_score=9.0,
                domain_detected="supply_chain",
                summary="Supply chain halted at key suppliers with customer complaints rising."
            )
        elif response_model == PlanResult:
            return PlanResult(
                action_chain=[
                    ActionItem(
                        action_id="ACT-01",
                        action_type="simulate_procurement_order",
                        description="Emergency procurement order of 150 units of Heavy Duty Bearings from Local Bearing World.",
                        parameters={"item": "Heavy Duty Bearings", "quantity": 150, "budget_pkr": 300000.0, "eta_hours": 12.0},
                        constraints={"budget_pkr": 500000.0},
                        confidence=0.95,
                        urgency=0.9,
                        impact=0.85,
                        priority_score=0.9,
                        reasoning="Resolve imminent bearing stockout by ordering from local source.",
                        fallback_action={"action_type": "escalate_issue", "parameters": {"severity": "critical", "assignee": "supply_chain_head", "context": "Emergency bearing procurement order failed."}}
                    ),
                    ActionItem(
                        action_id="ACT-02",
                        action_type="notify_stakeholder",
                        description="Alert supply chain department of valves labor halt delay.",
                        parameters={"channel": "email", "message": "Valves supplier halted. Delaying deliveries.", "priority": "high"},
                        constraints={},
                        confidence=0.9,
                        urgency=0.8,
                        impact=0.7,
                        priority_score=0.8,
                        reasoning="Keep stakeholders informed of downstream delays.",
                        fallback_action={"action_type": "escalate_issue", "parameters": {"severity": "high", "assignee": "ops_director", "context": "Notification failed."}}
                    ),
                    ActionItem(
                        action_id="ACT-03",
                        action_type="update_system_record",
                        description="Record valve delays status in global system record.",
                        parameters={"system_id": "SYS-DASH-992", "payload_json": "{\"valve_status\":\"delayed\"}"},
                        constraints={},
                        confidence=0.95,
                        urgency=0.7,
                        impact=0.8,
                        priority_score=0.8,
                        reasoning="Ensure ERP system reflects real status.",
                        fallback_action={"action_type": "schedule_monitoring", "parameters": {"target": "SYS-DASH-992", "interval_minutes": 10}}
                    )
                ],
                plan_confidence=0.92,
                plan_summary="Emergency bearing procurement and stakeholder notification chain."
            )
        elif response_model == SelfHealDecision:
            return SelfHealDecision(
                decision="retry",
                modified_parameters={},
                reason="Transient connection lapse. Triggering system self-heal retry.",
                confidence=0.9
            )

    return client.chat.completions.create(
        response_model=response_model,
        messages=[{"role": "user", "content": prompt}],
        max_retries=max_retries
    )

def demonstrate_self_correction():
    """
    Intentionally send a malformed prompt that would cause a raw LLM to 
    return bad JSON. Instructor corrects it automatically.
    Use this during the demo to show robustness.
    """
    bad_prompt = """
    Return analysis but randomly omit some required fields and use 
    wrong types for numbers. Make it intentionally messy.
    Sources: warehouse CSV says stock=500, complaint feed says stock=0.
    """
    try:
        result = call_llm_structured(bad_prompt, AnalysisResult, max_retries=3)
        return {"status": "self_corrected", "result": result.model_dump()}
    except Exception as e:
        return {"status": "failed_after_retries", "error": str(e)}
