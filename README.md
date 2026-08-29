# PARTICLE.LAB

基于 [React Bits](https://github.com/DavidHDev/react-bits) 的 **ParticleText** 组件构建的工具箱站点：文字被拆成数千颗粒子，从混沌中聚拢成形，鼠标划过会四散避让。

**在线地址：** https://particle-lab-tau.vercel.app

## 功能

| 工具 | 说明 |
| --- | --- |
| 首页标题 | ParticleText 粒子大标题（聚拢动画 / 鼠标排斥 / 辉光） |
| 粒子实验室 | 实时调节文本、粒子大小、采样密度、散开半径、辉光与重播方式 |
| 网络接口 | HTTP 请求测试器，展示状态码、耗时与响应内容 |
| AI 对话 | DeepSeek `chat/completions` 流式对话（Key 存本机） |

## 技术栈

Vite + React 19，ParticleText 为纯 Canvas 2D 实现零第三方依赖。

## 本地运行

```sh
npm install
npm run dev
```

## 部署

Vercel 一键部署；`vercel.json` 已配置 `/deepseek-api/*` → `api.deepseek.com` 的重写，AI 对话在生产环境可用。

## 授权说明

- AI 对话的 DeepSeek API Key 仅保存在本机浏览器（localStorage），请求经服务端代理转发。
