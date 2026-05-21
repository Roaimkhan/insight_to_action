import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { startMockStream } from '../../services/mockStream';
import { useAgentStore } from '../../store/agentStore';

const SCENARIOS = [
  { id: 'supply_chain', name: 'Supply Chain', desc: 'Inventory and logistics' },
  { id: 'power_grid', name: 'Power Grid', desc: 'Grid stability' },
  { id: 'sentiment_crisis', name: 'Sentiment Crisis', desc: 'Brand sentiment' },
];

const DemoBottomSheet: React.FC<{ sheetRef: any }> = ({ sheetRef }) => {
  const setMockMode = useAgentStore((s) => s.setMockMode);
  const setStatus = useAgentStore((s) => s.setStatus);

  const runScenario = (id: string) => {
    setMockMode(true);
    setStatus('running');
    startMockStream(id as any, {
      llm_token: (e: any) => useAgentStore.getState().appendToken(e.content),
      complete: () => useAgentStore.getState().setStatus('complete'),
    } as any);
  };

  // Graceful fallback: if @gorhom/bottom-sheet isn't available, render a simple list.
  let BottomSheetComponent: any = null;
  try {
    // dynamic require to avoid app crash when not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BottomSheetComponent = require('@gorhom/bottom-sheet').default;
  } catch (e) {
    BottomSheetComponent = null;
  }

  if (!BottomSheetComponent) {
    return (
      <View style={{ padding: 12 }}>
        <View style={{ padding: 12 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Try a Demo Scenario</Text>
          {SCENARIOS.map((s) => (
            <Pressable key={s.id} onPress={() => runScenario(s.id)} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{s.name}</Text>
              <Text style={{ color: '#666' }}>{s.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <BottomSheetComponent ref={sheetRef} index={-1} snapPoints={["25%", "50%"]}>
      <View style={{ padding: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Try a Demo Scenario</Text>
        {SCENARIOS.map((s) => (
          <Pressable key={s.id} onPress={() => runScenario(s.id)} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{s.name}</Text>
            <Text style={{ color: '#666' }}>{s.desc}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheetComponent>
  );
};

export default DemoBottomSheet;
