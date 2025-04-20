import React, { useState, useEffect } from 'react';
import { getOperators } from '../services/api';

export default function SerialOperatorForm({ onNext }) {
  const [serialNumber, setSerialNumber] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    getOperators().then(res => setOperators(res.data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (serialNumber && operatorId) {
      onNext({ serialNumber, operatorId });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Serial Number"
        value={serialNumber}
        onChange={(e) => setSerialNumber(e.target.value)}
        required
      />
      <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)} required>
        <option value="">Select Operator</option>
        {operators.map(op => (
          <option key={op.id} value={op.id}>{op.name}</option>
        ))}
      </select>
      <button type="submit">Next</button>
    </form>
  );
}
