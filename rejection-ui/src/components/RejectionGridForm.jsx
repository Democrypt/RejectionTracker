import React, { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  Box,
  Paper,
  Stack
} from '@mui/material';
import { getOperators, API_BASE } from '../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RejectionGridForm() {
  const [serialNumber, setSerialNumber] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [operators, setOperators] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getOperators().then(res => setOperators(res.data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (serialNumber && operatorId) {
      navigate('/grid', {
        state: { serialNumber, operatorId }
      });
    }
  };

  const handleGenerateOperators = async () => {
    try {
      await axios.post(`${API_BASE}/dev/generate-operators`);
      alert('Operators generated!');
      const res = await getOperators();
      setOperators(res.data); // refresh list
    } catch {
      alert('Failed to generate operators.');
    }
  };

  const handleGenerateRejections = async () => {
    if (!window.confirm('⚠️ This will DELETE all rejection data and generate random test data. Proceed?')) return;
    try {
      await axios.post(`${API_BASE}/dev/generate-rejections`);
      alert('Random rejections generated!');
    } catch {
      alert('Failed to generate rejections.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        px: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          background: 'transparent',
          boxShadow: 'none'
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <TextField
            label="Serial Number"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
          />

          <TextField
            select
            label="Operator"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            required
          >
            {operators.map((op) => (
              <MenuItem key={op.id} value={op.id}>
                {op.name}
              </MenuItem>
            ))}
          </TextField>

          <Box textAlign="right" display="flex" gap={2} justifyContent="flex-end">
            <Button type="submit" variant="contained" color="primary">
              Next
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => navigate('/analytics')}>
              Show Analytics
            </Button>
          </Box>
        </Box>

        {/* Dev/Test Buttons */}
        <Stack direction="row" spacing={2} mt={4}>
          <Button variant="outlined" onClick={handleGenerateOperators}>
            Generate Operators
          </Button>
          <Button variant="contained" color="warning" onClick={handleGenerateRejections}>
            Generate Rejections
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
