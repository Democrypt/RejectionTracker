// Full Updated RejectionSideTiles.jsx

import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Button, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getGridSettings,
  getReasons,
  submitRejection,
  getExistingRejections
} from '../services/api';

const SIDES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

export default function RejectionSideTiles() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serialNumber, operatorId } = location.state || {};

  const [grid, setGrid] = useState(null);
  const canvasRef = useRef();
  const backgroundImage = useRef(null);

  const [selectedSide, setSelectedSide] = useState('front');
  const [reasons, setReasons] = useState([]);
  const [reasonId, setReasonId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clicksBySide, setClicksBySide] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clicks = clicksBySide[selectedSide] || [];

  useEffect(() => {
    getGridSettings().then(res => setGrid(res.data));
  }, []);

  useEffect(() => {
    if (!serialNumber || !operatorId || !grid) return;

    getReasons().then(res => {
      setReasons(res.data);

      getExistingRejections(serialNumber, date).then(res2 => {
        const grouped = SIDES.reduce((acc, side) => {
          acc[side] = [];
          return acc;
        }, {});

        res2.data.forEach(c => {
          const drawX = Math.floor(c.x / (grid.canvasWidth / grid.gridCols));
          const drawY = Math.floor(c.y / (grid.canvasHeight / grid.gridRows));

          const reason = res.data.find(r => r.id === c.reasonId);
          const color = reason?.color || '#cccccc';

          grouped[c.side].push({
            x: c.x,
            y: c.y,
            drawX,
            drawY,
            reasonId: c.reasonId,
            color,
            locked: true
          });
        });

        setClicksBySide(grouped);
      });
    });
  }, [serialNumber, operatorId, date, grid]);

  useEffect(() => {
    if (!grid) return;
    const img = new Image();
    img.src = `/tibet-block/tibet-block-${selectedSide}.png`;
    img.onload = () => {
      backgroundImage.current = img;
      drawGrid();
    };
  }, [selectedSide, grid]);

  useEffect(() => {
    if (grid) drawGrid();
  }, [clicks, reasons, grid]);

  if (!grid) {
    return <Typography sx={{ p: 3, textAlign: 'center' }}>Loading grid settings...</Typography>;
  }

  const { gridCols, gridRows, canvasWidth, canvasHeight } = grid;
  const CELL_WIDTH = canvasWidth / gridCols;
  const CELL_HEIGHT = canvasHeight / gridRows;

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage.current?.complete) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(CELL_WIDTH, CELL_HEIGHT); // shift content to make room for rulers

    // draw background image
    ctx.globalAlpha = 0.5;
    ctx.drawImage(backgroundImage.current, 0, 0, canvasWidth, canvasHeight);

    // draw filled cells
    clicks.forEach(({ drawX, drawY, color }) => {
      const cellX = drawX * CELL_WIDTH;
      const cellY = drawY * CELL_HEIGHT;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = color;
      ctx.fillRect(cellX, cellY, CELL_WIDTH, CELL_HEIGHT);
    });

    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.25;

    for (let i = 0; i < gridCols; i++) {
      for (let j = 0; j < gridRows; j++) {
        const cellX = i * CELL_WIDTH;
        const cellY = j * CELL_HEIGHT;
        ctx.strokeRect(cellX, cellY, CELL_WIDTH, CELL_HEIGHT);
      }
    }

    ctx.restore();

    // draw rulers outside grid
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.floor(CELL_HEIGHT / 2.2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // top letters
    for (let i = 0; i < gridCols; i++) {
      const x = CELL_WIDTH + i * CELL_WIDTH + CELL_WIDTH / 2;
      ctx.fillText(String.fromCharCode(65 + i), x, CELL_HEIGHT / 2);
    }

    // left numbers
    for (let j = 0; j < gridRows; j++) {
      const y = CELL_HEIGHT + j * CELL_HEIGHT + CELL_HEIGHT / 2;
      ctx.fillText((j + 1).toString(), CELL_WIDTH / 2, y);
    }
  };

  const handleClick = (e) => {
    if (!reasonId) return alert('Select a reason first!');

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const canvasX = (e.clientX - rect.left - CELL_WIDTH) * scaleX;
    const canvasY = (e.clientY - rect.top - CELL_HEIGHT) * scaleY;

    const drawX = Math.floor(canvasX / CELL_WIDTH);
    const drawY = Math.floor(canvasY / CELL_HEIGHT);

    if (clicks.some(c => c.drawX === drawX && c.drawY === drawY && c.locked)) {
      return;
    }

    if (!clicks.some(c => c.drawX === drawX && c.drawY === drawY)) {
      const reason = reasons.find(r => r.id === parseInt(reasonId));
      const color = reason?.color || '#cccccc';

      const updated = [...clicks, {
        x: canvasX,
        y: canvasY,
        drawX,
        drawY,
        side: selectedSide,
        reasonId: parseInt(reasonId),
        color
      }];
      setClicksBySide(prev => ({ ...prev, [selectedSide]: updated }));
    }
  };

  const handleClear = () => {
    setClicksBySide(prev => ({ ...prev, [selectedSide]: [] }));
  };

  const handleFinalSave = async () => {
    setConfirmOpen(false);

    const allClicks = Object.entries(clicksBySide).flatMap(([side, clicks]) =>
      clicks.filter(c => !c.locked).map(c => ({
        x: c.x,
        y: c.y,
        reasonId: c.reasonId,
        side
      }))
    );

    const payload = {
      serialNumber,
      date: new Date(date).toISOString(),
      operatorId: parseInt(operatorId),
      coordinates: allClicks
    };

    try {
      await submitRejection(payload);
      alert('Saved to DB!');
    } catch (err) {
      console.error(err);
      alert('Failed to save. Check backend.');
    }
  };

  const totalChanges = SIDES.reduce((sum, side) =>
    sum + (clicksBySide[side]?.filter(c => !c.locked).length || 0), 0);

  return (
    <Paper sx={{ p: 2, boxShadow: 'none' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
        <Stack spacing={2} sx={{ width: { xs: '100%', lg: '360px' } }}>
          <Paper sx={{ p: 2 }}>
            <TextField
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Reason"
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            >
              {reasons.map(r => (
                <MenuItem key={r.id} value={r.id} style={{ backgroundColor: r.color, color: '#fff' }}>
                  {r.reasonText}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>Sides</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {SIDES.map(side => (
                <Box
                  key={side}
                  onClick={() => setSelectedSide(side)}
                  sx={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: selectedSide === side ? '2px solid #00bcd4' : '1px solid #444',
                    cursor: 'pointer'
                  }}
                >
                  <Box
                    component="img"
                    src={`/tibet-block/tibet-block-${side}.png`}
                    alt={side}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box sx={{ position: 'absolute', top: 4, left: 6, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', px: 0.5, borderRadius: 1 }}>
                    {side.toUpperCase()}
                  </Box>
                  <Box sx={{ position: 'absolute', bottom: 4, right: 6, fontSize: 12, backgroundColor: '#2196f3', color: '#fff', px: 0.75, borderRadius: 1 }}>
                    {clicksBySide[side]?.length || 0}
                  </Box>
                </Box>
              ))}
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button onClick={handleClear} color="error">CLEAR</Button>
              <Button onClick={() => setConfirmOpen(true)} variant="contained" disabled={totalChanges === 0}>SAVE ALL</Button>
              <Button variant="outlined" onClick={() => navigate('/')}>BACK</Button>
            </Stack>
          </Paper>
        </Stack>

        <Box sx={{ flexGrow: 1 }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth + CELL_WIDTH}
            height={canvasHeight + CELL_HEIGHT}
            style={{ border: '1px solid #888', width: '100%', height: 'auto', cursor: 'pointer' }}
            onClick={handleClick}
          />
        </Box>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent>
          <Typography>Changes by side:</Typography>
          <ul>
            {SIDES.map(side => (
              <li key={side}>{side.toUpperCase()}: {clicksBySide[side]?.filter(c => !c.locked).length || 0} new</li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleFinalSave} variant="contained" color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}