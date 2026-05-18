import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home/Home';
import Agent from './pages/Agent/Agent';
import Comparison from './pages/Comparison/Comparison';
import Metrics from './pages/Metrics/Metrics';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/metrics" element={<Metrics />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
