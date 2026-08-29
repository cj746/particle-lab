import { useState } from 'react';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const PRESETS = [
  { label: 'GitHub 仓库信息', method: 'GET', url: 'https://api.github.com/repos/DavidHDev/react-bits' },
  { label: '查询我的 IP', method: 'GET', url: 'https://api.ipify.org?format=json' },
  { label: 'HTTP 回显（POST）', method: 'POST', url: 'https://httpbin.org/post' }
];

export default function ApiTool() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState(PRESETS[0].url);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (nextUrl = url, nextMethod = method) => {
    const target = nextUrl.trim();
    if (!target || loading) return;
    setLoading(true);
    setResult(null);
    const started = performance.now();
    try {
      const options = { method: nextMethod };
      if (nextMethod !== 'GET' && body.trim()) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = body;
      }
      const res = await fetch(target, options);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResult({
        error: false,
        ok: res.ok,
        status: res.status,
        ms: Math.round(performance.now() - started),
        dataText: pretty.slice(0, 6000)
      });
    } catch (err) {
      setResult({
        error: true,
        ms: Math.round(performance.now() - started),
        message: `${err}`
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = preset => {
    setUrl(preset.url);
    setMethod(preset.method);
    send(preset.url, preset.method);
  };

  return (
    <section className="tool-section">
      <p className="section__eyebrow">API CONSOLE</p>
      <h2 className="section__title">网络接口</h2>
      <p className="section__desc">
        向任意公开 HTTP 接口发送请求，查看状态码、耗时与响应内容。浏览器端请求受 CORS
        限制，若失败请换用允许跨域的接口。
      </p>

      <div className="api__bar">
        <div className="seg api__method">
          {METHODS.map(m => (
            <button
              key={m}
              className={`seg-btn${method === m ? ' is-active' : ''}`}
              onClick={() => setMethod(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          className="lab__input api__url"
          value={url}
          placeholder="https://…"
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="btn btn--primary api__send" onClick={() => send()} disabled={loading}>
          {loading ? '请求中…' : '发送请求'}
        </button>
      </div>

      <div className="api__presets">
        <span className="api__presets-label">快速尝试</span>
        {PRESETS.map(p => (
          <button key={p.label} className="chip" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      {method !== 'GET' && (
        <textarea
          className="lab__input api__body"
          value={body}
          rows={4}
          placeholder={'请求体（JSON），例如 {"name":"particle"}'}
          onChange={e => setBody(e.target.value)}
        />
      )}

      <div className="api__result">
        {loading && <p className="api__empty">请求中，请稍候…</p>}
        {!loading && !result && (
          <p className="api__empty">发送请求后，响应会显示在这里；也可以直接点上面的快速示例。</p>
        )}
        {!loading && result && result.error && (
          <div>
            <div className="api__meta">
              <span className="api__badge api__badge--err">请求失败</span>
              <span className="api__time">{result.ms} ms</span>
            </div>
            <pre className="api__pre">
              {result.message +
                '\n\n提示：浏览器端 fetch 受 CORS 跨域限制，目标接口未开放跨域时会直接失败；可尝试左侧快速示例中允许跨域的接口。'}
            </pre>
          </div>
        )}
        {!loading && result && !result.error && (
          <div>
            <div className="api__meta">
              <span className={`api__badge ${result.ok ? 'api__badge--ok' : 'api__badge--warn'}`}>
                {result.status} {result.ok ? 'OK' : 'Error'}
              </span>
              <span className="api__time">{result.ms} ms</span>
            </div>
            <pre className="api__pre">{result.dataText || '（空响应）'}</pre>
          </div>
        )}
      </div>
    </section>
  );
}
