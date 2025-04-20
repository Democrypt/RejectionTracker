import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Modal, Typography, TextField, MenuItem, Stack, Button
} from '@mui/material';
import { getReasons } from '../services/api';

const GRID_COLS = 10;
const GRID_ROWS = 10;

export default function RejectionGridModal({ open, onClose, side, onSave }) {
  const canvasRef = useRef();
  const backgroundImage = useRef(null);
  const clicksRef = useRef([]);

  const [reasons, setReasons] = useState([]);
  const [reasonId, setReasonId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clicks, setClicks] = useState([]);

  useEffect(() => {
    getReasons().then(res => setReasons(res.data));
    backgroundImage.current = new Image();
    backgroundImage.current.src = `/tibet-block/tibet-block-${side}.png`;
    backgroundImage.current.onload = () => resizeAndDraw();
  }, [side]);

  useEffect(() => {
    clicksRef.current = clicks;
    if (canvasRef.current && backgroundImage.current?.complete) drawGrid(clicks);
  }, [clicks, reasons]);

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

    if (backgroundImage.current?.complete) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(backgroundImage.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

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
    const x = Math.floor(canvasX / (canvas.width / GRID_COLS));
    const y = Math.floor(canvasY / (canvas.height / GRID_ROWS));
    return { x, y };
  };

  const handleClick = (e) => {
    if (!reasonId) return alert('Select reason first!');
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

  const handleClear = () => {
    setClicks([]);
  };

  const handleSave = () => {
    onSave(clicks);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ width: '100vw', height: '100vh', p: 3, bgcolor: '#0f1214' }}>
        <Typography variant="h6" gutterBottom>Edit Side: {side.toUpperCase()}</Typography>

        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} mb={2}>
          <TextField
            type="date"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <TextField
            select
            label="Reason"
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {reasons.map((r) => (
              <MenuItem
                key={r.id}
                value={r.id}
                style={{ backgroundColor: r.color, color: '#fff' }}
              >
                {r.reasonText}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box sx={{ flexGrow: 1, border: '1px solid #999', borderRadius: 2, overflow: 'hidden', height: '70%' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
            onClick={handleClick}
          />
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={handleClear} color="error" variant="contained">Clear</Button>
          <Button onClick={handleSave} color="success" variant="contained">Save</Button>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
        </Stack>
      </Box>
    </Modal>
  );
}
