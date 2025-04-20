import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Button, MenuItem, Paper, Stack, TextField, Typography, Slider
} from '@mui/material';
import {
  getGridSettings,
  getReasons,
  getOperators,
  getHeatmapData
} from '../services/api';

const SIDES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getDistinctColor(index) {
  const colors = ['#e91e63', '#3f51b5', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
  return colors[index % colors.length];
}

export default function AnalyticsHeatmap() {
  const canvasRef = useRef();
  const bgImage = useRef(null);

  const [grid, setGrid] = useState(null);
  const [data, setData] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [operators, setOperators] = useState([]);

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    operatorId: '',
    reasonId: '',
    serialNumber: '',
  });

  const [selectedSide, setSelectedSide] = useState('front');
  const [heatmapMode, setHeatmapMode] = useState('stacked');
  const [radius, setRadius] = useState(60);

  useEffect(() => {
    getGridSettings().then(r => setGrid(r.data));
    getReasons().then(r => setReasons(r.data));
    getOperators().then(o => setOperators(o.data));
  }, []);

  useEffect(() => {
    if (!grid) return;
    const img = new Image();
    img.src = `/tibet-block/tibet-block-${selectedSide}.png`;
    img.onload = () => {
      bgImage.current = img;
      drawGrid();
    };
  }, [selectedSide, grid, data, heatmapMode, radius]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    const res = await getHeatmapData({
      from: filters.from ? new Date(filters.from).toISOString() : null,
      to: filters.to ? new Date(filters.to).toISOString() : null,
      operatorId: filters.operatorId || null,
      reasonId: filters.reasonId || null,
      serialNumber: filters.serialNumber.trim || null
    });
    setData(res.data);
  };

  const drawGrid = () => {
    if (!grid || !bgImage.current?.complete) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const { gridCols, gridRows, canvasWidth, canvasHeight } = grid;
    const CELL_WIDTH = canvasWidth / gridCols;
    const CELL_HEIGHT = canvasHeight / gridRows;

    canvas.width = canvasWidth + CELL_WIDTH;
    canvas.height = canvasHeight + CELL_HEIGHT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(CELL_WIDTH, CELL_HEIGHT);

    // Draw background
    ctx.globalAlpha = 0.5;
    ctx.drawImage(bgImage.current, 0, 0, canvasWidth, canvasHeight);
    ctx.globalAlpha = 1;

    const filtered = data.filter(c => c.side === selectedSide);

    if (heatmapMode === 'stacked') {
      const counts = {};
      filtered.forEach(c => {
        const col = Math.floor(c.x / CELL_WIDTH);
        const row = Math.floor(c.y / CELL_HEIGHT);
        const key = `${col}-${row}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      const max = Math.max(...Object.values(counts), 1);

      Object.entries(counts).forEach(([key, count]) => {
        const [col, row] = key.split('-').map(Number);
        const x = col * CELL_WIDTH;
        const y = row * CELL_HEIGHT;

        const ratio = count / max;
        const r = Math.floor(255 * ratio);
        const g = Math.floor(255 * (1 - ratio));
        ctx.fillStyle = `rgba(${r},${g},0,0.7)`;
        ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);

        // Draw count text
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.floor(CELL_HEIGHT / 2.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);
      });

      // Grid lines + Rulers
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 1.5;

      for (let i = 0; i < gridCols; i++) {
        for (let j = 0; j < gridRows; j++) {
          ctx.strokeRect(i * CELL_WIDTH, j * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
        }
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(CELL_HEIGHT / 2.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < gridCols; i++) {
        ctx.fillText(String.fromCharCode(65 + i), i * CELL_WIDTH + CELL_WIDTH / 2, -CELL_HEIGHT / 2);
      }
      for (let j = 0; j < gridRows; j++) {
        ctx.fillText((j + 1).toString(), -CELL_WIDTH / 2, j * CELL_HEIGHT + CELL_HEIGHT / 2);
      }
    } else {
      // Radius mode: blob clusters
      const clusters = [];

      filtered.forEach(p => {
        let added = false;
        for (let cluster of clusters) {
          const dx = cluster.x - p.x;
          const dy = cluster.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            cluster.x = (cluster.x * cluster.count + p.x) / (cluster.count + 1);
            cluster.y = (cluster.y * cluster.count + p.y) / (cluster.count + 1);
            cluster.count++;
            added = true;
            break;
          }
        }
        if (!added) clusters.push({ x: p.x, y: p.y, count: 1 });
      });

      clusters.forEach((c, i) => {
        const color = getDistinctColor(i);
        ctx.fillStyle = hexToRgba(color, 0.5);
        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = `${radius / 2.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.count, c.x, c.y);
      });
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Analytics Heatmap</Typography>

      <Stack spacing={2} direction="row" flexWrap="wrap" sx={{ mb: 2 }}>
        <TextField label="Date From" type="date" value={filters.from} InputLabelProps={{ shrink: true }} onChange={(e) => handleFilterChange('from', e.target.value)} />
        <TextField label="Date To" type="date" value={filters.to} InputLabelProps={{ shrink: true }} onChange={(e) => handleFilterChange('to', e.target.value)} />
        <TextField label="Serial Number" value={filters.serialNumber} onChange={(e) => handleFilterChange('serialNumber', e.target.value)} />
        <TextField select label="Operator" value={filters.operatorId} onChange={(e) => handleFilterChange('operatorId', e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="">All</MenuItem>
          {operators.map(op => (
            <MenuItem key={op.id} value={op.id}>{op.name}</MenuItem>
          ))}
        </TextField>
        <TextField select label="Reason" value={filters.reasonId} onChange={(e) => handleFilterChange('reasonId', e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="">All</MenuItem>
          {reasons.map(r => (
            <MenuItem key={r.id} value={r.id} style={{ backgroundColor: r.color, color: '#fff' }}>
              {r.reasonText}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleSearch}>Search</Button>
      </Stack>

      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        {SIDES.map(side => (
          <Button key={side} variant={side === selectedSide ? 'contained' : 'outlined'} onClick={() => setSelectedSide(side)}>
            {side.toUpperCase()}
          </Button>
        ))}
        <Button
          variant={heatmapMode === 'stacked' ? 'contained' : 'outlined'}
          onClick={() => setHeatmapMode('stacked')}
        >Stacked Cells</Button>
        <Button
          variant={heatmapMode === 'radius' ? 'contained' : 'outlined'}
          onClick={() => setHeatmapMode('radius')}
        >Radius Mode</Button>
      </Stack>

      {heatmapMode === 'radius' && (
        <Box sx={{ width: 300, mb: 2 }}>
          <Typography gutterBottom>Radius: {radius}px</Typography>
          <Slider
            value={radius}
            min={10}
            max={200}
            step={1}
            onChange={(_, v) => setRadius(v)}
          />
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          width: grid ? `${grid.canvasWidth + grid.canvasWidth / grid.gridCols}px` : '100%',
          height: grid ? `${grid.canvasHeight + grid.canvasHeight / grid.gridRows}px` : 'auto',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #888',
            maxWidth: '100%',
            display: 'block'
          }}
        />
      </Box>
    </Paper>
  );
}
