import { useEffect, useRef, useState } from 'react';

const MODELS = [
  ['deepseek-chat', 'V3 通用'],
  ['deepseek-reasoner', 'R1 推理']
];

// DeepSeek API 已开放浏览器跨域直连（实测 2026-08 返回真实状态码而非 CORS 拦截），
// 因此无论部署在 Vercel、本地还是静态托管（如腾讯云 COS）都可直接调用，无需服务端代理。
const API_URL = 'https://api.deepseek.com/chat/completions';

const KEY_STORAGE = 'deepseek_api_key';

export default function ChatTool() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) || '');
  const [keyDraft, setKeyDraft] = useState('');
  const [model, setModel] = useState('deepseek-chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const saveKey = () => {
    const v = keyDraft.trim();
    if (!v) return;
    setApiKey(v);
    localStorage.setItem(KEY_STORAGE, v);
    setKeyDraft('');
    setError('');
  };

  const clearKey = () => {
    setApiKey('');
    localStorage.removeItem(KEY_STORAGE);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) {
      setError('请先填入 DeepSeek API Key（在 platform.deepseek.com 可申请）');
      return;
    }
    setError('');
    const history = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '', reasoning: '' }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages: history, stream: true })
      });
      if (!res.ok || !res.body) {
        let detail = '';
        try {
          const j = await res.json();
          detail = j?.error?.message || '';
        } catch {}
        if (res.status === 401) throw new Error(`API Key 无效（401）${detail ? '：' + detail : ''}`);
        if (res.status === 402) throw new Error(`账户余额不足（402）${detail ? '：' + detail : ''}`);
        if (res.status === 429) throw new Error(`请求过于频繁（429），请稍后再试`);
        throw new Error(`接口返回状态码 ${res.status} ${detail}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta || {};
            if (delta.content || delta.reasoning_content) {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + (delta.content || ''),
                    reasoning: (last.reasoning || '') + (delta.reasoning_content || '')
                  };
                }
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(`${err.message || err}`);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-section chat-section">
      <p className="section__eyebrow">DEEPSEEK API</p>
      <h2 className="section__title">AI 对话</h2>
      <p className="section__desc">
        直连调用 DeepSeek 的 chat/completions 接口。API Key 只保存在你本机浏览器里，
        不会上传到别处。
      </p>

      <div className="chat__setup">
        {apiKey ? (
          <div className="chat__keyrow">
            <span className="chat__keyok">API Key 已配置（本机保存）</span>
            <div className="seg chat__models">
              {MODELS.map(([id, label]) => (
                <button
                  key={id}
                  className={`seg-btn${model === id ? ' is-active' : ''}`}
                  onClick={() => setModel(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="chip" onClick={clearKey}>更换 Key</button>
          </div>
        ) : (
          <div className="chat__keyrow">
            <input
              type="password"
              className="lab__input chat__key"
              placeholder="填入 DeepSeek API Key（sk-…）"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
            />
            <button className="chip" onClick={saveKey}>保存</button>
            <a
              className="chat__apply"
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noreferrer"
            >
              没有 Key？去申请 ↗
            </a>
          </div>
        )}
      </div>

      <div className="chat__box">
        <div className="chat__list" ref={listRef}>
          {messages.length === 0 && !loading && (
            <p className="chat__empty">和 DeepSeek 打个招呼吧～配置好 Key 后输入消息即可对话。</p>
          )}
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div className="chat__msg chat__msg--user" key={i}>{m.content}</div>
            ) : (
              <div className="chat__msg chat__msg--ai" key={i}>
                {m.reasoning && (
                  <details className="chat__think">
                    <summary>思考过程</summary>
                    <p>{m.reasoning}</p>
                  </details>
                )}
                <p className="chat__content">{m.content || (loading && i === messages.length - 1 ? '…' : '')}</p>
              </div>
            )
          )}
        </div>
        {error && <p className="chat__error">{error}</p>}
        <div className="chat__inputrow">
          <textarea
            className="lab__input chat__input"
            rows={2}
            value={input}
            placeholder={apiKey ? '输入消息，Enter 发送（Shift+Enter 换行）' : '先配置 API Key 再开始对话'}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="btn btn--primary chat__send" onClick={send} disabled={loading}>
            {loading ? '生成中…' : '发送'}
          </button>
          <button
            className="chip chat__clear"
            onClick={() => { setMessages([]); setError(''); }}
          >
            清空对话
          </button>
        </div>
      </div>
    </section>
  );
}
