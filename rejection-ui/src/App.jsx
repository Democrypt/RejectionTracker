import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RejectionGridForm from './components/RejectionGridForm';
import RejectionSideTiles from './components/RejectionSideTiles';
import AnalyticsHeatmap from './components/AnalyticsHeatmap';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RejectionGridForm />} />
      <Route path="/grid" element={<RejectionSideTiles />} />
      <Route path="/analytics" element={<AnalyticsHeatmap />} />
    </Routes>
  );
}
