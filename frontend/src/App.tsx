import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home/Home';
import Agent from './pages/Agent/Agent';
import Comparison from './pages/Comparison/Comparison';
import Metrics from './pages/Metrics/Metrics';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AuthGuard from './components/AuthGuard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          } />
          
          <Route path="/agent" element={
            <AuthGuard>
              <Agent />
            </AuthGuard>
          } />
          
          <Route path="/comparison" element={
            <AuthGuard>
              <Comparison />
            </AuthGuard>
          } />
          
          <Route path="/metrics" element={
            <AuthGuard>
              <Metrics />
            </AuthGuard>
          } />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
