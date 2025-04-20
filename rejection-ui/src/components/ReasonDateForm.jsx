import React, { useState, useEffect } from 'react';
import { getReasons } from '../services/api';

export default function ReasonDateForm({ onReady }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reasonId, setReasonId] = useState('');
  const [reasons, setReasons] = useState([]);

  useEffect(() => {
    getReasons().then(res => setReasons(res.data));
  }, []);

  const handleContinue = () => {
    if (reasonId && date) {
      onReady({ reasonId, date });
    }
  };

  return (
    <div>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <select value={reasonId} onChange={e => setReasonId(e.target.value)} required>
        <option value="">Select Reason</option>
        {reasons.map(r => (
          <option key={r.id} value={r.id}>{r.reasonText}</option>
        ))}
      </select>
      <button onClick={handleContinue}>Continue</button>
    </div>
  );
}
