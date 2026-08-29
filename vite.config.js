import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /deepseek-api/* 由开发服务器转发到 DeepSeek 官方接口：
// 该 API 不允许浏览器跨域直连，必须经服务端代理；API Key 由前端随请求携带。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/deepseek-api': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/deepseek-api/, '')
      }
    }
  }
});
