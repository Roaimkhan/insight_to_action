import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AnimatedFileChip from './AnimatedFileChip';
import { api } from '../../services/api';
import { agentWebSocket } from '../../services/websocket';
import type { ScenarioId } from '../../types/agent';
import { colors } from '../../constants/colors';

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: 'supply_chain', label: 'Supply Chain' },
  { id: 'power_grid', label: 'Power Grid' },
  { id: 'sentiment_crisis', label: 'Sentiment Crisis' },
];

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

const UploadPromptPanel: React.FC = () => {
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [prompt, setPrompt] = useState('Summarize key risks and produce an action plan.');
  const [scenario, setScenario] = useState<ScenarioId>('supply_chain');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'connecting' | 'running' | 'complete' | 'error'>('idle');
  const [lines, setLines] = useState<string[]>([]);

  const appendLine = (line: string) => setLines((current) => [line, ...current].slice(0, 24));

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (!result.canceled) {
      setFiles((current) => [...current, ...(result.assets ?? [])]);
      appendLine(`Selected ${result.assets?.length ?? 0} file(s)`);
    }
  };

  const remove = (idx: number) => setFiles((current) => current.filter((_, i) => i !== idx));

  const runAnalysis = async () => {
    if (!files.length) {
      appendLine('No files selected');
      return;
    }

    try {
      setStatus('uploading');
      appendLine('Uploading files...');
      const uploadRes = await api.uploadFiles(files, prompt);
      appendLine(`Upload session: ${(uploadRes as { session_id?: string }).session_id ?? 'unknown'}`);

      setStatus('connecting');
      const runRes = await api.runScenario(scenario);
      const liveSessionId = (runRes as { session_id: string }).session_id;
      setSessionId(liveSessionId);
      appendLine(`Run session: ${liveSessionId}`);

      setStatus('running');
      agentWebSocket.connect(BACKEND_URL, liveSessionId, scenario, (event) => {
        if (event.type === 'node_start') appendLine(`Node: ${event.node}`);
        if (event.type === 'source_ingested') appendLine(`Source: ${event.source.label || event.source.source_id}`);
        if (event.type === 'contradiction') appendLine(`Contradiction: ${event.data.resolution}`);
        if (event.type === 'llm_token') appendLine(event.content.trim());
        if (event.type === 'step_complete') appendLine(`Step ${event.step} complete`);
        if (event.type === 'self_heal') appendLine(`Self heal tier ${event.tier}: ${event.detail}`);
        if (event.type === 'complete') {
          setStatus('complete');
          appendLine('Complete');
        }
      });
    } catch (error) {
      setStatus('error');
      appendLine(String(error));
    }
  };

  const scenarioButtons = useMemo(() => SCENARIOS, []);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ padding: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.08)' }}>
        <Text style={{ fontSize: 12, letterSpacing: 1.4, color: colors.text.muted, marginBottom: 10 }}>UPLOAD + PROMPT</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {scenarioButtons.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setScenario(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: scenario === item.id }}
              style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: scenario === item.id ? '#0f766e' : 'rgba(15, 23, 42, 0.08)', backgroundColor: scenario === item.id ? 'rgba(15, 118, 110, 0.08)' : '#fff' }}
            >
              <Text style={{ color: scenario === item.id ? '#0f766e' : colors.text.primary, fontWeight: '700', fontSize: 12 }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe the analysis you want"
          placeholderTextColor={colors.text.muted}
          multiline
          style={{ minHeight: 92, borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.1)', borderRadius: 12, padding: 12, color: colors.text.primary, textAlignVertical: 'top', marginBottom: 12, backgroundColor: '#fbfcfe' }}
        />

        <Pressable onPress={pick} style={{ padding: 14, borderWidth: 1, borderRadius: 12, borderColor: 'rgba(15, 23, 42, 0.1)', marginBottom: 12 }} accessibilityRole="button" accessibilityLabel="Select files to upload">
          <Text style={{ fontWeight: '700', color: colors.text.primary }}>Select files</Text>
          <Text style={{ color: colors.text.muted, marginTop: 4 }}>PDF, CSV, JSON, TXT, images and more</Text>
        </Pressable>

        <FlatList
          horizontal
          data={files}
          keyExtractor={(item, idx) => item.name ?? item.uri ?? String(idx)}
          renderItem={({ item, index }) => (
            <AnimatedFileChip name={item.name || item.uri} onRemove={() => remove(index)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={runAnalysis}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#0f766e', alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Run analysis"
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>{status === 'running' ? 'Running...' : 'Run Analysis'}</Text>
          </Pressable>
          <Pressable
            onPress={() => { setFiles([]); setLines([]); setSessionId(null); setStatus('idle'); }}
            style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.1)' }}
            accessibilityRole="button"
            accessibilityLabel="Clear files"
          >
            <Text style={{ fontWeight: '800', color: colors.text.primary }}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ padding: 14, backgroundColor: '#08111f', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.12)' }}>
        <Text style={{ fontSize: 12, letterSpacing: 1.4, color: '#7dd3fc', marginBottom: 8 }}>LIVE SESSION</Text>
        <Text style={{ color: '#dbeafe', fontWeight: '700' }}>{sessionId || 'Waiting for run'}</Text>
        <Text style={{ color: '#94a3b8', marginBottom: 10, fontSize: 12 }}>Status: {status}</Text>
        <ScrollView style={{ maxHeight: 220 }}>
          {lines.map((line, index) => (
            <Text key={`${line}-${index}`} style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: 12, marginBottom: 4 }}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default UploadPromptPanel;
