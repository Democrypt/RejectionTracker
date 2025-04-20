import axios from 'axios'; // ✅ All imports first

export const API_BASE = 'https://rejection-api.onrender.com/api'; // ✅ then constants

export const getOperators = () =>
  axios.get(`${API_BASE}/operators`);

export const getReasons = () =>
  axios.get(`${API_BASE}/reasons`);

export const getGridSettings = () =>
  axios.get(`${API_BASE}/gridsettings`);

export const submitRejection = (data) =>
  axios.post(`${API_BASE}/rejections`, data);

export const getExistingRejections = (serialNumber, date) =>
  axios.get(`${API_BASE}/rejections/existing`, {
    params: { serialNumber, date }
  });

export const getHeatmapData = (filter) =>
  axios.post(`${API_BASE}/analytics/heatmap`, filter);
