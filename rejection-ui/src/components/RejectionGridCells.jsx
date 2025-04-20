import React, { useEffect, useRef, useState } from 'react';
import {
  TextField, MenuItem, Button, Box, Typography, Paper, Stack
} from '@mui/material';
import { getReasons, submitRejection } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

const GRID_COLS = 10;
const GRID_ROWS = 10;

export default function RejectionGridCells() {
  const canvasRef = useRef();
  const clicksRef = useRef([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reasonId, setReasonId] = useState('');
  const [reasons, setReasons] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [animationState, setAnimationState] = useState('');
  const backgroundImage = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { serialNumber, operatorId } = location.state || {};

  useEffect(() => {
    if (!serialNumber || !operatorId) {
      navigate('/');
    }
  }, [serialNumber, operatorId, navigate]);

  useEffect(() => {
    getReasons().then(res => setReasons(res.data));

    backgroundImage.current = new Image();
    backgroundImage.current.src = '/tibet-block.png';
    backgroundImage.current.onload = () => resizeAndDraw();
    backgroundImage.current.onerror = () =>
      console.warn('Failed to load background image.');
  }, []);

  useEffect(() => {
    clicksRef.current = clicks;
    if (canvasRef.current && backgroundImage.current?.complete) {
      drawGrid(clicks);
    }
  }, [clicks, reasons]);

  useEffect(() => {
    const handleResize = () => resizeAndDraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resizeAndDraw = () => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    drawGrid(clicksRef.current);
  };

  const drawGrid = (clickData = []) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cellWidth = canvas.width / GRID_COLS;
    const cellHeight = canvas.height / GRID_ROWS;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image at 50% opacity
    if (backgroundImage.current && backgroundImage.current.complete) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(backgroundImage.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Fill clicked cells
    clickData.forEach(({ x, y, color }) => {
      const cellX = x * cellWidth;
      const cellY = y * cellHeight;

      ctx.globalAlpha = 0.4;
      ctx.fillStyle = color || '#cccccc';
      ctx.fillRect(cellX, cellY, cellWidth, cellHeight);

      ctx.globalAlpha = 1;
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(cellX + 1, cellY + 1, cellWidth - 2, cellHeight - 2);
    });

    // Draw grid lines and labels
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1;
    ctx.font = `${Math.floor(cellHeight * 0.4)}px Segoe UI`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < GRID_COLS; i++) {
      for (let j = 0; j < GRID_ROWS; j++) {
        const cellX = i * cellWidth;
        const cellY = j * cellHeight;
        const label = `${String.fromCharCode(65 + i)}${j + 1}`;

        ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
        ctx.fillText(label, cellX + cellWidth / 2, cellY + cellHeight / 2);
      }
    }
  };

  const getCell = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const cellWidth = canvas.width / GRID_COLS;
    const cellHeight = canvas.height / GRID_ROWS;

    const x = Math.floor(canvasX / cellWidth);
    const y = Math.floor(canvasY / cellHeight);

    return { x, y };
  };

  const handleClick = (e) => {
    if (!reasonId) return alert('Please select a reason first!');
    const { x, y } = getCell(e);
    const cell = `${String.fromCharCode(65 + x)}${y + 1}`;
    if (!clicks.some(p => p.x === x && p.y === y)) {
      const reason = reasons.find(r => r.id === parseInt(reasonId));
      const color = reason?.color || '#cccccc';
      const updated = [...clicks, { x, y, cellPosition: cell, reasonId: parseInt(reasonId), color }];
      clicksRef.current = updated;
      setClicks(updated);
    }
  };

  const triggerCanvasFlash = (type) => {
    setAnimationState(type);
    setTimeout(() => setAnimationState(''), 500);
  };

  const handleClear = () => {
    clicksRef.current = [];
    setClicks([]);
    triggerCanvasFlash('cleared');
  };

  const handleSave = async () => {
    const payload = { serialNumber, date, operatorId, coordinates: clicks };
    await submitRejection(payload);
    alert('Rejection saved!');
    clicksRef.current = [];
    setClicks([]);
    triggerCanvasFlash('saved');
  };

  const getFlashColor = () => {
    if (animationState === 'saved') return '#1f2d3d';
    if (animationState === 'cleared') return '#3d1f1f';
    return 'transparent';
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Step 2: Date, Reason & Grid</Typography>

      <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} sx={{ mb: 3 }}>
        <TextField
          type="date"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <TextField
          select
          label="Reason"
          value={reasonId}
          onChange={(e) => setReasonId(e.target.value)}
          required
          sx={{
            minWidth: 200,
            '& .MuiSelect-select': {
              color: reasons.find(r => r.id === parseInt(reasonId))?.color || '#ffffff'
            }
          }}
        >
          {reasons.map((r) => (
            <MenuItem
              key={r.id}
              value={r.id}
              style={{
                backgroundColor: r.color,
                color: '#ffffff',
                opacity: 0.95
              }}
            >
              {r.reasonText}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          border: '1px solid #999',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 3,
          backgroundColor: getFlashColor(),
          transition: 'background-color 0.5s ease-in-out'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
          onClick={handleClick}
        />
      </Box>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="contained" color="error" onClick={handleClear}>Clear</Button>
        <Button variant="contained" color="success" onClick={handleSave}>Save</Button>
        <Button variant="outlined" onClick={() => navigate('/')}>Back</Button>
      </Stack>
    </Paper>
  );
}
