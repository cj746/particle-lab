import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 不使用 StrictMode：开发模式下它会让 effect 双跑，
// ParticleText 每次挂载都要重采样几千颗粒子，双跑会让工具切换明显卡顿。
createRoot(document.getElementById('root')).render(<App />);
