import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home/Home';
import Agent from './pages/Agent/Agent';
import Comparison from './pages/Comparison/Comparison';
import Metrics from './pages/Metrics/Metrics';
import Session from './pages/Session/Session';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/insights" element={<Session />} />
          <Route path="/audit" element={<Session />} />
          
          {/* NEW: Live orchestration dashboard for a running session */}
          <Route path="/session/:sessionId" element={<Session />} />
          
          {/* Fallback for legacy routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
