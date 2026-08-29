import { useEffect, useRef, useState } from 'react';
import ParticleText from './components/ParticleText/ParticleText.jsx';
import ApiTool from './components/ApiTool.jsx';
import ChatTool from './components/ChatTool.jsx';

const HERO_FONT = "'Space Grotesk', 'Microsoft YaHei', sans-serif";

const TOOLS = [
  { id: 'home', name: '首页标题', desc: 'PARTICLE 粒子大标题', keywords: 'home hero 首页 标题' },
  { id: 'lab', name: '粒子实验室', desc: 'ParticleText 参数调试', keywords: 'lab 粒子 实验室 playground' },
  { id: 'api', name: '网络接口', desc: 'HTTP 请求测试器', keywords: 'api 接口 网络 http 请求 fetch' },
  { id: 'chat', name: 'AI 对话', desc: 'DeepSeek 智能问答', keywords: 'ai chat deepseek 对话 聊天 智能 助手' }
];

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  lab: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v6.5L4.5 18a3 3 0 0 0 2.6 4.5h9.8a3 3 0 0 0 2.6-4.5L14 8.5V2" />
      <path d="M8.5 2h7" />
      <path d="M7 15h10" />
    </svg>
  ),
  api: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 5 6 13h5l-1 6 7-8h-5l1-6z" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8 8 0 0 1-8.7 8 8.4 8.4 0 0 1-3.4-.9L3 20l1.4-4.1A8 8 0 1 1 21 11.5z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </svg>
  )
};

export default function App() {
  const [query, setQuery] = useState('');
  const [activeTool, setActiveTool] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 实验室的可调参数（放在 App 级，切换工具后仍保留）
  const [labText, setLabText] = useState('你好世界');
  const [particleSize, setParticleSize] = useState(2.4);
  const [density, setDensity] = useState(4);
  const [scatter, setScatter] = useState(220);
  const [glow, setGlow] = useState(true);
  const [trigger, setTrigger] = useState('mount');

  // 实验室自定义背景：{ type: 'image' | 'video', src }
  const [bgMode, setBgMode] = useState('default');
  const [bg, setBg] = useState(null);
  const [bgUrl, setBgUrl] = useState('');

  // 滚轮在工具间切换：内容滚到边界再翻页。
  // 用「意图累积」避免触控板惯性造成的误切/粘滞：
  // - 距上次滚轮事件超过 220ms 视为一次新意图，累积清零；
  // - 累积 delta 超过 60 才真正切换；
  // - 切换后 650ms 冷却，等进场动画播完。
  const contentRef = useRef(null);
  const wheelAcc = useRef(0);
  const wheelLock = useRef(0);
  const lastWheelAt = useRef(0);

  const switchToolByDir = dir => {
    const idx = TOOLS.findIndex(t => t.id === activeTool);
    const next = TOOLS[(idx + dir + TOOLS.length) % TOOLS.length];
    setActiveTool(next.id);
  };

  const handleWheel = e => {
    const el = contentRef.current;
    if (!el) return;
    const now = performance.now();
    if (now - lastWheelAt.current > 220) wheelAcc.current = 0;
    lastWheelAt.current = now;
    if (now - wheelLock.current < 650) return;

    const atTop = el.scrollTop <= 4;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
    if (!((e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop))) return;

    wheelAcc.current += e.deltaY;
    if (Math.abs(wheelAcc.current) >= 60) {
      wheelAcc.current = 0;
      wheelLock.current = now;
      switchToolByDir(e.deltaY > 0 ? 1 : -1);
    }
  };

  const applyBgFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bg?.src.startsWith('blob:')) URL.revokeObjectURL(bg.src);
    setBg({ type: bgMode, src: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const clearBg = () => {
    if (bg?.src.startsWith('blob:')) URL.revokeObjectURL(bg.src);
    setBg(null);
    setBgMode('default');
  };

  const q = query.trim().toLowerCase();
  const visibleTools = q
    ? TOOLS.filter(t => `${t.name}${t.desc}${t.keywords}`.toLowerCase().includes(q))
    : TOOLS;

  const openFirstMatch = () => {
    if (visibleTools.length > 0) {
      setActiveTool(visibleTools[0].id);
      setQuery('');
    }
  };

  return (
    <div className="app">
      <div className="bg-glow bg-glow--a" aria-hidden="true" />
      <div className="bg-glow bg-glow--b" aria-hidden="true" />
      <div className="bg-glow bg-glow--c" aria-hidden="true" />

      <header className="nav">
        <button
          className="nav__menu"
          title={sidebarOpen ? '收起工具栏' : '展开工具栏'}
          onClick={() => setSidebarOpen(v => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <a className="nav__logo" href="#top" onClick={e => { e.preventDefault(); setActiveTool('home'); }}>
          <span className="nav__dot" aria-hidden="true" />
          PARTICLE.LAB
        </a>

        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            placeholder="搜索工具：粒子 / 接口 / 首页"
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') openFirstMatch();
              if (e.key === 'Escape') setQuery('');
            }}
          />
        </div>

        <a
          className="nav__github"
          href="https://github.com/DavidHDev/react-bits"
          target="_blank"
          rel="noreferrer"
        >
          React Bits ↗
        </a>
      </header>

      <div className="app-body">
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar--collapsed'}`}>
          <button
            className="sidebar__toggle"
            title={sidebarOpen ? '收起工具栏' : '展开工具栏'}
            onClick={() => setSidebarOpen(v => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {sidebarOpen
                ? <path d="m15 6-6 6 6 6" />
                : <path d="m9 6 6 6-6 6" />}
            </svg>
          </button>
          {sidebarOpen && <p className="sidebar__label">工具箱</p>}
          {visibleTools.map(tool => (
            <button
              key={tool.id}
              className={`tool-btn${activeTool === tool.id ? ' is-active' : ''}`}
              title={tool.name}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="tool-btn__icon" aria-hidden="true">{ICONS[tool.id]}</span>
              {sidebarOpen && (
                <span className="tool-btn__text">
                  {tool.name}
                  <small>{tool.desc}</small>
                </span>
              )}
            </button>
          ))}
          {visibleTools.length === 0 && sidebarOpen && (
            <p className="sidebar__empty">没有匹配「{query.trim()}」的工具</p>
          )}
          {sidebarOpen && (
            <p className="sidebar__hint">在右侧内容区滚动滚轮，可依次切换工具</p>
          )}
        </aside>

        <main className="content" ref={contentRef} onWheel={handleWheel}>
          <div className="view-anim" key={activeTool}>
          {activeTool === 'home' && (
            <section className="hero" id="top">
              <div className="hero__title">
                <ParticleText
                  text="PARTICLE"
                  fontSize="clamp(4rem, 14vw, 10.5rem)"
                  fontWeight={900}
                  fontFamily={HERO_FONT}
                  color="#ff4d8d"
                  highlightColor="#ffc93c"
                  particleSize={2.4}
                  density={4}
                  scatter={260}
                  gatherDuration={1900}
                  stagger={480}
                  pointerRepel={46}
                  repelRadius={130}
                  idleDrift={0.8}
                  glow
                />
              </div>
            </section>
          )}

          {activeTool === 'lab' && (
            <section className="tool-section">
              <p className="section__eyebrow">PLAYGROUND</p>
              <h2 className="section__title">粒子实验室</h2>
              <p className="section__desc">
                调整参数，下面的标题会实时重新采样、重新聚拢。
              </p>

              <div className="lab">
                <div className="lab__stage">
                  {bg?.type === 'image' && <img className="lab__bg" src={bg.src} alt="" />}
                  {bg?.type === 'video' && (
                    <video className="lab__bg" src={bg.src} autoPlay loop muted playsInline />
                  )}
                  <ParticleText
                    text={labText || ' '}
                    fontSize="clamp(2.5rem, 9vw, 6rem)"
                    fontWeight={900}
                    fontFamily={HERO_FONT}
                    color="#7c5cff"
                    highlightColor="#22d3ee"
                    particleSize={particleSize}
                    density={density}
                    scatter={scatter}
                    gatherDuration={1600}
                    stagger={420}
                    pointerRepel={40}
                    repelRadius={120}
                    idleDrift={0.7}
                    glow={glow}
                    trigger={trigger}
                  />
                </div>

                <div className="lab__panel">
                  <label className="lab__field">
                    <span className="lab__label">文本内容</span>
                    <input
                      className="lab__input"
                      value={labText}
                      maxLength={14}
                      placeholder="输入文字试试"
                      onChange={e => setLabText(e.target.value)}
                    />
                  </label>

                  <label className="lab__field">
                    <span className="lab__label">
                      粒子大小 <code>{particleSize.toFixed(1)}px</code>
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.2"
                      value={particleSize}
                      onChange={e => setParticleSize(Number(e.target.value))}
                    />
                  </label>

                  <label className="lab__field">
                    <span className="lab__label">
                      采样密度 <code>{density}</code>
                    </span>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      step="1"
                      value={density}
                      onChange={e => setDensity(Number(e.target.value))}
                    />
                  </label>

                  <label className="lab__field">
                    <span className="lab__label">
                      散开半径 <code>{scatter}px</code>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      step="10"
                      value={scatter}
                      onChange={e => setScatter(Number(e.target.value))}
                    />
                  </label>

                  <div className="lab__field">
                    <span className="lab__label">重播方式</span>
                    <div className="seg">
                      {['mount', 'hover', 'click'].map(t => (
                        <button
                          key={t}
                          className={`seg-btn${trigger === t ? ' is-active' : ''}`}
                          onClick={() => setTrigger(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="lab__field lab__field--row">
                    <span className="lab__label">辉光效果</span>
                    <input
                      type="checkbox"
                      checked={glow}
                      onChange={e => setGlow(e.target.checked)}
                    />
                  </label>

                  <div className="lab__field">
                    <span className="lab__label">自定义背景</span>
                    <div className="seg">
                      {[
                        ['default', '默认'],
                        ['image', '图片'],
                        ['video', '视频']
                      ].map(([mode, label]) => (
                        <button
                          key={mode}
                          className={`seg-btn${bgMode === mode ? ' is-active' : ''}`}
                          onClick={() => setBgMode(mode)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {bgMode !== 'default' && (
                    <div className="lab__field">
                      <span className="lab__label">背景来源</span>
                      <div className="lab__bg-actions">
                        <label className="chip lab__upload">
                          上传{bgMode === 'image' ? '图片' : '视频'}
                          <input
                            type="file"
                            accept={bgMode === 'image' ? 'image/*' : 'video/*'}
                            hidden
                            onChange={applyBgFile}
                          />
                        </label>
                        <input
                          className="lab__input lab__bg-url"
                          value={bgUrl}
                          placeholder={bgMode === 'image' ? '或粘贴图片链接 https://…/bg.jpg' : '或粘贴视频链接 https://…/bg.mp4'}
                          onChange={e => setBgUrl(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && bgUrl.trim()) {
                              setBg({ type: bgMode, src: bgUrl.trim() });
                            }
                          }}
                        />
                        <button
                          className="chip"
                          onClick={() => bgUrl.trim() && setBg({ type: bgMode, src: bgUrl.trim() })}
                        >
                          应用链接
                        </button>
                      </div>
                    </div>
                  )}

                  {bg && (
                    <button className="chip lab__bg-clear" onClick={clearBg}>
                      恢复默认背景
                    </button>
                  )}

                  <p className="lab__tip">
                    {trigger === 'hover' && '鼠标划入画布即可重新聚拢。'}
                    {trigger === 'click' && '点击画布即可重新聚拢。'}
                    {trigger === 'mount' && '修改任意参数即可重新聚拢。'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTool === 'api' && <ApiTool />}

          {activeTool === 'chat' && <ChatTool />}
          </div>
        </main>
      </div>
    </div>
  );
}
