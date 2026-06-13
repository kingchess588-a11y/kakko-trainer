import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

// ── helpers ──────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function highlightBrackets(text) {
  return esc(text)
    .replace(/〖([^〗]*)〗/g, '<span class="r-vocab">〖$1〗</span>')
    .replace(/〔([^〕]*)〕/g, '<span class="r-gram">〔$1〕</span>')
    .replace(/⚠️([^⚠️\n]+)⚠️/g, '<span class="r-warn">⚠️$1⚠️</span>')
}

function parseOutput(raw) {
  const m = raw.match(/```uncertain\s*([\s\S]*?)```/)
  let main = raw.replace(/```uncertain[\s\S]*?```/, '').trim()
  let uncertain = []
  if (m) { try { uncertain = JSON.parse(m[1].trim()) } catch {} }
  return { main, uncertain }
}

// ── components ────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="loading">
      <span /><span /><span />
      <style jsx>{`
        .loading { display:flex; gap:5px; align-items:center; padding:4px 0; }
        span {
          width:7px; height:7px;
          background:var(--accent); border-radius:50%;
          animation: bounce 1.1s infinite;
        }
        span:nth-child(2) { animation-delay:.18s; }
        span:nth-child(3) { animation-delay:.36s; }
        @keyframes bounce {
          0%,80%,100% { transform:scale(.55); opacity:.4; }
          40% { transform:scale(1); opacity:1; }
        }
      `}</style>
    </div>
  )
}

function QuestionCard({ item, onAnswer, onSkip }) {
  const [val, setVal] = useState('')
  const ref = useRef()
  useEffect(() => { ref.current?.focus() }, [])

  const confirm = () => { if (val.trim()) onAnswer(item.word, val.trim()) }

  return (
    <div className="qcard">
      <div className="qcard-label">⚠️ Không chắc — cần xác nhận</div>
      <div className="qcard-word">{item.word}</div>
      <div className="qcard-q">
        {item.question || `Từ "${item.word}" nên đóng ngoặc thế nào?`}
        {item.context && <span className="qcard-ctx"> (Ngữ cảnh: {item.context})</span>}
      </div>
      <input
        ref={ref}
        className="qcard-input"
        placeholder={`VD: 〖${item.word}|kanji〗`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && confirm()}
      />
      <div className="qcard-actions">
        <button className="btn-confirm" onClick={confirm} disabled={!val.trim()}>✅ Lưu & tiếp tục</button>
        <button className="btn-skip" onClick={onSkip}>Bỏ qua</button>
      </div>
      <style jsx>{`
        .qcard {
          background: var(--surface2);
          border: 1px solid #f6ad5555;
          border-radius: var(--r);
          padding: 14px 16px;
          margin-top: 10px;
        }
        .qcard-label {
          font-size:.68rem; font-weight:700; letter-spacing:1.5px;
          color: var(--warn); text-transform:uppercase; margin-bottom:8px;
        }
        .qcard-word {
          font-family: var(--font-jp);
          font-size:1.1rem; color:var(--text); margin-bottom:6px;
        }
        .qcard-q { font-size:.82rem; color:var(--text2); margin-bottom:10px; line-height:1.5; }
        .qcard-ctx { color:var(--text3); font-size:.78rem; }
        .qcard-input {
          width:100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          color: var(--text);
          padding: 8px 12px;
          font-size:.88rem;
          outline:none;
          margin-bottom:10px;
          transition: border-color .15s;
        }
        .qcard-input:focus { border-color: var(--warn); }
        .qcard-actions { display:flex; gap:8px; }
        .btn-confirm {
          background: #f6ad5522; border: 1px solid #f6ad5566;
          border-radius: var(--r-sm); color: var(--warn);
          padding: 7px 16px; font-size:.78rem; font-weight:700;
          transition: all .15s;
        }
        .btn-confirm:hover:not(:disabled) { background: #f6ad5544; }
        .btn-confirm:disabled { opacity:.4; cursor:not-allowed; }
        .btn-skip {
          background:none; border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text3);
          padding:7px 14px; font-size:.78rem;
          transition: all .15s;
        }
        .btn-skip:hover { color:var(--text2); border-color:var(--text3); }
      `}</style>
    </div>
  )
}

function ResultBox({ text, copyable = true }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="rbox-wrap">
      <div className="rbox-label">📝 Kết quả</div>
      <div
        className="rbox"
        dangerouslySetInnerHTML={{ __html: highlightBrackets(text) }}
      />
      {copyable && (
        <button className="rbox-copy" onClick={copy}>
          {copied ? '✅ Đã copy!' : '📋 Copy'}
        </button>
      )}
      <style jsx>{`
        .rbox-wrap { margin-top:10px; }
        .rbox-label { font-size:.7rem; color:var(--text3); margin-bottom:6px; letter-spacing:.5px; }
        .rbox {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 12px 14px;
          font-family: var(--font-jp);
          font-size:.9rem; line-height:2;
          white-space:pre-wrap; word-break:break-all;
        }
        .rbox-copy {
          margin-top:8px;
          background: var(--surface2); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text2);
          padding:5px 14px; font-size:.73rem;
          transition: all .15s;
        }
        .rbox-copy:hover { background:var(--border); color:var(--text); }
      `}</style>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState({})
  const [ruleSearch, setRuleSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [toast, setToast] = useState('')
  const [sideTab, setSideTab] = useState('rules')
  const [teachSurface, setTeachSurface] = useState('')
  const [teachBracket, setTeachBracket] = useState('')
  const [teachNote, setTeachNote] = useState('')
  const [teachMsg, setTeachMsg] = useState(null)

  // Uncertain flow state
  const [uncertain, setUncertain] = useState([])
  const [uncertainIdx, setUncertainIdx] = useState(0)
  const [pendingResult, setPendingResult] = useState('')

  const msgEndRef = useRef()

  // Load rules on mount
  useEffect(() => {
    fetch('/api/rules')
      .then(r => r.json())
      .then(d => setRules(d.rules || {}))
      .catch(() => {})
  }, [])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  // ── Xử lý form dạy trực tiếp ──
  async function handleTeachForm() {
    const surface = teachSurface.trim()
    const bracket = teachBracket.trim()
    const note = teachNote.trim()
    if (!surface || !bracket) return
    try {
      const command = note
        ? `!dạy ${surface} → ${bracket} note: ${note}`
        : `!dạy ${surface} → ${bracket}`
      const res = await fetch('/api/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      })
      const data = await res.json()
      if (data.rules) setRules(data.rules)
      setTeachMsg({ ok: data.ok, text: data.message })
      if (data.ok) {
        setTeachSurface('')
        setTeachBracket('')
        setTeachNote('')
        setTimeout(() => setTeachMsg(null), 3000)
      }
    } catch (err) {
      setTeachMsg({ ok: false, text: err.message })
    }
  }

  // ── Phát hiện lệnh dạy ──
  function isTeachCommand(text) {
    return /^!(dạy|sửa|xóa|note|xem)/i.test(text)
  }

  // ── Xử lý lệnh dạy (không gọi AI) ──
  async function handleTeachCommand(text) {
    try {
      const res = await fetch('/api/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text })
      })
      const data = await res.json()
      if (data.rules) setRules(data.rules)
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'bot',
        type: data.ok ? 'teach-ok' : 'teach-err',
        text: data.message
      }])
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'bot', type: 'error', text: err.message }])
    }
  }

  // ── Send message ──
  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }])

    // Lệnh dạy → không gọi AI, không tốn API
    if (isTeachCommand(text)) {
      await handleTeachCommand(text)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      const { main, uncertain: items } = parseOutput(data.output)

      if (items.length > 0) {
        setPendingResult(main)
        setUncertain(items)
        setUncertainIdx(0)
        setMessages(prev => [
          ...prev,
          { id: Date.now(), role: 'bot', type: 'partial', text: main },
          { id: Date.now() + 1, role: 'bot', type: 'question', item: items[0] }
        ])
      } else {
        setMessages(prev => [...prev, { id: Date.now(), role: 'bot', type: 'result', text: main }])
        autoLearn(main)
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'bot', type: 'error', text: err.message }])
    }

    setLoading(false)
  }

  // ── Uncertain answer ──
  async function handleAnswer(word, bracket) {
    // Save rule
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surface: word, bracket, type: 'confirmed' })
    })
    const data = await res.json()
    setRules(data.rules || {})
    showToast(`✅ Đã lưu: ${word} → ${bracket}`)

    // Update pending
    const updated = pendingResult.replace(
      new RegExp(`⚠️${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}⚠️`, 'g'),
      bracket
    )
    setPendingResult(updated)

    nextUncertain(updated)
  }

  function handleSkip() {
    nextUncertain(pendingResult)
  }

  function nextUncertain(currentResult) {
    const next = uncertainIdx + 1
    if (next < uncertain.length) {
      setUncertainIdx(next)
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: 'bot', type: 'question', item: uncertain[next] }
      ])
    } else {
      // Done
      const cleaned = currentResult.replace(/⚠️([^⚠️]+)⚠️/g, '$1')
      setMessages(prev => [...prev, { id: Date.now(), role: 'bot', type: 'result', text: cleaned }])
      autoLearn(cleaned)
      setUncertain([])
      setPendingResult('')
    }
  }

  // ── Auto-learn từ output ──
  async function autoLearn(text) {
    const matches = [...text.matchAll(/〖([^|〖〗]+)\|([^〖〗]+)〗/g)]
    for (const m of matches) {
      const surface = m[1].trim()
      const base = m[2].trim()
      if (surface && !rules[surface]) {
        const res = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surface, bracket: `〖${surface}|${base}〗`, type: 'auto' })
        })
        const data = await res.json()
        setRules(data.rules || {})
      }
    }
  }

  // ── Delete rule ──
  async function deleteRule(surface) {
    const res = await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surface })
    })
    const data = await res.json()
    setRules(data.rules || {})
    showToast(`🗑️ Đã xóa: ${surface}`)
  }

  // ── Export ──
  function doExport() {
    const json = JSON.stringify(rules, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'kakko_rules.json'; a.click()
    URL.revokeObjectURL(url)
    showToast('📤 Đã export!')
  }

  // ── Import ──
  async function doImport() {
    try {
      const parsed = JSON.parse(importText)
      const res = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: parsed })
      })
      const data = await res.json()
      setRules(data.rules || {})
      setShowImport(false)
      setImportText('')
      showToast(`✅ Import ${data.imported} rules!`)
    } catch {
      showToast('❌ JSON không hợp lệ!')
    }
  }

  // ── Clear all ──
  async function clearAll() {
    if (!confirm('Xóa tất cả rules đã học?')) return
    await fetch('/api/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: {} })
    })
    setRules({})
    showToast('🗑️ Đã xóa tất cả.')
  }

  const filteredRules = Object.entries(rules).filter(([s, v]) =>
    !ruleSearch || s.includes(ruleSearch) || v.bracket.includes(ruleSearch)
  ).sort((a, b) => (b[1].updatedAt || '') > (a[1].updatedAt || '') ? 1 : -1)

  const ruleCount = Object.keys(rules).length

  return (
    <>
      <Head>
        <title>括弧AI — Kakko Trainer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <span className="logo">括弧<em>AI</em></span>
            <span className="rule-count">Đã học: <b>{ruleCount}</b> từ</span>
          </div>
          <div className="header-right">
            <button className="btn-hdr" onClick={doExport}>📤 Export</button>
            <button className="btn-hdr" onClick={() => setShowImport(true)}>📥 Import</button>
            <button className="btn-hdr btn-danger" onClick={clearAll}>🗑️</button>
          </div>
        </header>

        <div className="main">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sb-tabs">
              <button className={`sb-tab ${sideTab==='rules'?'active':''}`} onClick={()=>setSideTab('rules')}>📚 Đã học ({ruleCount})</button>
              <button className={`sb-tab ${sideTab==='teach'?'active':''}`} onClick={()=>setSideTab('teach')}>✏️ Dạy bot</button>
            </div>

            {sideTab === 'rules' && <>
              <input className="sb-search" placeholder="Tìm từ..." value={ruleSearch} onChange={e=>setRuleSearch(e.target.value)}/>
              <div className="sb-list">
                {filteredRules.length === 0 ? (
                  <div className="sb-empty">{ruleCount===0?'Chưa có rule nào.\nBắt đầu đóng ngoặc!':'Không tìm thấy.'}</div>
                ) : filteredRules.map(([surface, data]) => (
                  <div key={surface} className="rule-item">
                    <div className="ri-surface">{surface}</div>
                    <div className="ri-bracket">{data.bracket}</div>
                    {data.note && <div className="ri-note">📝 {data.note}</div>}
                    <button className="ri-del" onClick={()=>deleteRule(surface)}>✕</button>
                  </div>
                ))}
              </div>
            </>}

            {sideTab === 'teach' && (
              <div className="teach-panel">
                <div className="tp-desc">Thêm rule trực tiếp — không tốn API</div>
                <div className="tp-field">
                  <label>Từ / cụm</label>
                  <input className="tp-input" placeholder="VD: こども" value={teachSurface} onChange={e=>setTeachSurface(e.target.value)}/>
                </div>
                <div className="tp-field">
                  <label>Bracket</label>
                  <input className="tp-input" placeholder="〖こども|子供〗" value={teachBracket} onChange={e=>setTeachBracket(e.target.value)}/>
                  <div className="tp-shortcuts">
                    <button onClick={()=>setTeachBracket(`〖${teachSurface}|〗`)}>〖〗vocab</button>
                    <button onClick={()=>setTeachBracket(`〔${teachSurface}〕`)}>〔〕ngữ pháp</button>
                  </div>
                </div>
                <div className="tp-field">
                  <label>Ghi chú <span className="tp-opt">(tùy chọn)</span></label>
                  <textarea className="tp-input tp-ta" placeholder="Khi nào dùng, khi nào không..." value={teachNote} onChange={e=>setTeachNote(e.target.value)} rows={2}/>
                </div>
                <button className="tp-submit" onClick={handleTeachForm} disabled={!teachSurface.trim()||!teachBracket.trim()}>✅ Lưu rule</button>
                {teachMsg && <div className={`tp-msg ${teachMsg.ok?'ok':'err'}`}>{teachMsg.text}</div>}
              </div>
            )}
          </aside>

          {/* Chat */}
          <div className="chat">
            <div className="messages">
              {messages.length === 0 && (
                <div className="welcome">
                  <div className="welcome-icon">〖〗</div>
                  <h2>Kakko Trainer</h2>
                  <p>Paste văn bản tiếng Nhật để đóng ngoặc.<br />Hoặc dạy bot trực tiếp bằng lệnh <b>!</b></p>
                  <div className="teach-guide">
                    <div className="tg-title">📖 Lệnh dạy (không tốn API)</div>
                    {[
                      { cmd: '!dạy こども → 〖こども|子供〗', desc: 'Thêm rule mới' },
                      { cmd: '!sửa 前に → 〔前に〕 note: chỉ khi là ngữ pháp', desc: 'Sửa + thêm ghi chú' },
                      { cmd: '!xóa こども', desc: 'Xóa rule' },
                      { cmd: '!note 場合 → chỉ đóng khi là ngữ pháp', desc: 'Thêm ghi chú' },
                      { cmd: '!xem 前に', desc: 'Xem thông tin rule' },
                    ].map(({ cmd, desc }) => (
                      <button key={cmd} className="tg-btn" onClick={() => setInput(cmd)}>
                        <code>{cmd}</code>
                        <span>{desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="examples">
                    <div className="ex-label">Thử đóng ngoặc:</div>
                    {[
                      '子どもたちは学校から家まで歩いて帰ります。',
                      'このレポートを読みやすく書き直してもらえますか。',
                      '忙しいから行けないと言っていました。'
                    ].map(ex => (
                      <button key={ex} className="ex-btn" onClick={() => setInput(ex)}>
                        → {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`msg msg-${msg.role}`}>
                  <div className="msg-avatar">{msg.role === 'bot' ? '🤖' : '👤'}</div>
                  <div className="msg-bubble">
                    {msg.role === 'user' && <span className="msg-text">{msg.text}</span>}

                    {msg.type === 'result' && <ResultBox text={msg.text} />}

                    {msg.type === 'partial' && (
                      <ResultBox text={msg.text} copyable={false} />
                    )}

                    {msg.type === 'question' && (
                      <QuestionCard
                        item={msg.item}
                        onAnswer={handleAnswer}
                        onSkip={handleSkip}
                      />
                    )}

                    {msg.type === 'teach-ok' && (
                      <div className="teach-result ok">
                        <pre>{msg.text}</pre>
                      </div>
                    )}

                    {msg.type === 'teach-err' && (
                      <div className="teach-result err">
                        <pre>{msg.text}</pre>
                      </div>
                    )}

                    {msg.type === 'error' && (
                      <span className="msg-error">⚠️ Lỗi: {msg.text}</span>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="msg msg-bot">
                  <div className="msg-avatar">🤖</div>
                  <div className="msg-bubble"><LoadingDots /></div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-wrap">
                <textarea
                  className="input-box"
                  placeholder="Nhập hoặc paste văn bản tiếng Nhật... (Enter để gửi, Shift+Enter xuống dòng)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                  }}
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                  }}
                />
                <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import modal */}
        {showImport && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setShowImport(false)}>
            <div className="modal">
              <h3>📥 Import Rules</h3>
              <textarea
                className="modal-textarea"
                placeholder="Paste JSON rules vào đây..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowImport(false)}>Hủy</button>
                <button className="btn-primary" onClick={doImport}>Import</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}
      </div>

      <style jsx global>{`
        .app { display:flex; flex-direction:column; height:100vh; overflow:hidden; }

        /* Header */
        .header {
          background:var(--surface); border-bottom:1px solid var(--border);
          padding:11px 20px; display:flex; align-items:center;
          justify-content:space-between; flex-shrink:0;
        }
        .header-left { display:flex; align-items:center; gap:12px; }
        .logo { font-size:1.05rem; font-weight:700; color:var(--accent); letter-spacing:-.5px; }
        .logo em { color:var(--teal); font-style:normal; }
        .rule-count {
          background:var(--surface2); border:1px solid var(--border);
          border-radius:20px; padding:3px 11px;
          font-size:.71rem; color:var(--text2);
        }
        .rule-count b { color:var(--teal); }
        .header-right { display:flex; gap:7px; }
        .btn-hdr {
          background:var(--surface2); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text2);
          padding:5px 12px; font-size:.73rem;
          transition:all .15s;
        }
        .btn-hdr:hover { background:var(--border); color:var(--text); }
        .btn-danger:hover { background:#fc818122; color:var(--danger); border-color:#fc818155; }

        /* Layout */
        .main { display:flex; flex:1; overflow:hidden; }

        /* Sidebar */
        .sidebar {
          width:240px; background:var(--surface);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column; flex-shrink:0;
          overflow:hidden;
        }
        /* Sidebar tabs */
        .sb-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
        .sb-tab {
          flex:1; padding:9px 6px; font-size:.72rem; font-weight:600;
          background:none; border:none; color:var(--text3);
          cursor:pointer; transition:all .15s; border-bottom:2px solid transparent;
        }
        .sb-tab:hover { color:var(--text2); }
        .sb-tab.active { color:var(--accent); border-bottom-color:var(--accent); }

        /* Teach panel */
        .teach-panel { padding:12px 12px; overflow-y:auto; flex:1; }
        .tp-desc { font-size:.72rem; color:var(--text3); margin-bottom:14px; line-height:1.5; }
        .tp-field { margin-bottom:10px; }
        .tp-field label { display:block; font-size:.7rem; font-weight:600; color:var(--text3); margin-bottom:4px; letter-spacing:.5px; }
        .tp-opt { font-weight:400; color:var(--text3); }
        .tp-input {
          width:100%; background:var(--bg); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text);
          padding:7px 10px; font-size:.82rem; font-family:var(--font-jp);
          outline:none; transition:border-color .15s;
        }
        .tp-input:focus { border-color:var(--accent); }
        .tp-ta { resize:none; }
        .tp-shortcuts { display:flex; gap:6px; margin-top:5px; }
        .tp-shortcuts button {
          background:var(--surface2); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--teal);
          padding:3px 8px; font-size:.72rem; font-family:var(--font-jp);
          cursor:pointer; transition:all .15s;
        }
        .tp-shortcuts button:hover { border-color:var(--teal); }
        .tp-submit {
          width:100%; margin-top:4px;
          background:var(--accent); border:none; border-radius:var(--r-sm);
          color:#fff; padding:9px; font-size:.82rem; font-weight:700;
          cursor:pointer; transition:all .15s;
        }
        .tp-submit:hover:not(:disabled) { background:#6a58e8; }
        .tp-submit:disabled { background:var(--border); cursor:not-allowed; opacity:.5; }
        .tp-msg {
          margin-top:8px; padding:8px 10px; border-radius:var(--r-sm);
          font-size:.78rem; line-height:1.5; white-space:pre-wrap;
          font-family:var(--font-jp);
        }
        .tp-msg.ok { background:#68d39115; border:1px solid #68d39144; color:var(--success); }
        .tp-msg.err { background:#fc818115; border:1px solid #fc818144; color:var(--danger); }
        .ri-note { font-size:.68rem; color:var(--text3); margin-top:3px; line-height:1.4; }

        .sb-title {
          padding:13px 14px 10px;
          font-size:.68rem; font-weight:700; letter-spacing:2px;
          color:var(--text3); text-transform:uppercase;
          border-bottom:1px solid var(--border);
        }
        .sb-search {
          margin:10px 10px 6px;
          background:var(--bg); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text);
          padding:6px 10px; font-size:.8rem;
          font-family:var(--font-jp); outline:none;
          transition:border-color .15s;
        }
        .sb-search:focus { border-color:var(--accent); }
        .sb-list { flex:1; overflow-y:auto; padding:6px 8px; }
        .sb-empty {
          text-align:center; color:var(--text3);
          font-size:.76rem; padding:30px 12px;
          line-height:1.7; white-space:pre-line;
        }
        .rule-item {
          background:var(--surface2); border:1px solid var(--border);
          border-radius:var(--r-sm); padding:8px 10px;
          margin-bottom:5px; position:relative;
          transition:border-color .15s;
        }
        .rule-item:hover { border-color:var(--accent); }
        .ri-surface { font-size:.82rem; font-family:var(--font-jp); color:var(--text); }
        .ri-bracket { font-size:.74rem; font-family:var(--font-jp); color:var(--teal); margin-top:2px; word-break:break-all; }
        .ri-del {
          position:absolute; top:5px; right:5px;
          background:none; border:none; color:var(--text3);
          font-size:.68rem; padding:2px 5px; border-radius:4px;
          transition:all .15s; cursor:pointer;
        }
        .ri-del:hover { background:#fc818122; color:var(--danger); }

        /* Chat */
        .chat { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .messages { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }

        /* Welcome */
        .welcome { text-align:center; padding:30px 20px; color:var(--text3); }
        .welcome-icon {
          font-size:2.2rem; color:var(--accent);
          font-family:var(--font-jp); margin-bottom:14px;
          opacity:.6;
        }
        .welcome h2 { font-size:1.3rem; color:var(--text2); margin-bottom:8px; }
        .welcome p { font-size:.83rem; line-height:1.8; color:var(--text3); }

        /* Teach guide */
        .teach-guide {
          margin: 16px auto 0;
          max-width: 520px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r);
          overflow: hidden;
          text-align: left;
        }
        .tg-title {
          padding: 8px 14px;
          font-size: .68rem; font-weight: 700; letter-spacing: 1.5px;
          color: var(--text3); text-transform: uppercase;
          background: var(--surface2); border-bottom: 1px solid var(--border);
        }
        .tg-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 8px 14px;
          background: none; border: none; border-bottom: 1px solid var(--border);
          cursor: pointer; transition: background .15s; gap: 12px;
          text-align: left;
        }
        .tg-btn:last-child { border-bottom: none; }
        .tg-btn:hover { background: var(--surface2); }
        .tg-btn code {
          font-family: monospace; font-size: .78rem;
          color: var(--accent); flex-shrink: 0;
        }
        .tg-btn span { font-size: .72rem; color: var(--text3); }

        .examples { margin-top:14px; display:flex; flex-direction:column; gap:7px; max-width:520px; margin-left:auto; margin-right:auto; }
        .ex-label { font-size:.7rem; color:var(--text3); margin-bottom:2px; text-align:left; letter-spacing:1px; }
        .ex-btn {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--r-sm); padding:8px 14px;
          font-family:var(--font-jp); font-size:.81rem; color:var(--text2);
          text-align:left; transition:all .15s;
        }
        .ex-btn:hover { border-color:var(--accent); color:var(--text); }

        /* Teach result */
        .teach-result {
          border-radius: var(--r-sm);
          padding: 10px 14px;
        }
        .teach-result pre {
          font-family: var(--font-jp); font-size: .85rem;
          line-height: 1.7; white-space: pre-wrap; margin: 0;
        }
        .teach-result.ok { background: #68d39115; border: 1px solid #68d39144; }
        .teach-result.ok pre { color: var(--success); }
        .teach-result.err { background: #fc818115; border: 1px solid #fc818144; }
        .teach-result.err pre { color: var(--danger); }
          font-family:var(--font-jp); font-size:.81rem; color:var(--text2);
          text-align:left; transition:all .15s;
        }
        .ex-btn:hover { border-color:var(--accent); color:var(--text); }

        /* Messages */
        .msg { display:flex; gap:11px; max-width:820px; width:100%; }
        .msg-bot { align-self:flex-start; }
        .msg-user { align-self:flex-end; flex-direction:row-reverse; }
        .msg-avatar {
          width:31px; height:31px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:.82rem; flex-shrink:0; margin-top:2px;
          border:1px solid var(--border);
        }
        .msg-bot .msg-avatar { background:var(--accent-soft); border-color:#7c6af744; }
        .msg-user .msg-avatar { background:var(--teal-soft); border-color:#4fd1c544; }
        .msg-bubble {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--r); padding:11px 15px;
          font-family:var(--font-jp); font-size:.87rem; line-height:1.7;
          max-width:680px;
        }
        .msg-user .msg-bubble { background:var(--accent-soft); border-color:#7c6af744; }
        .msg-text { word-break:break-all; }
        .msg-error { color:var(--danger); font-size:.83rem; }

        /* Bracket colors */
        :global(.r-vocab) { color:#a78bfa; }
        :global(.r-gram) { color:#4fd1c5; }
        :global(.r-warn) { color:var(--warn); background:var(--warn-soft); border-radius:3px; padding:0 2px; }

        /* Input */
        .input-area {
          background:var(--surface); border-top:1px solid var(--border);
          padding:14px 20px; flex-shrink:0;
        }
        .input-wrap {
          background:var(--bg); border:1px solid var(--border);
          border-radius:var(--r); display:flex; align-items:flex-end;
          gap:10px; padding:9px 13px;
          transition:border-color .15s;
        }
        .input-wrap:focus-within { border-color:var(--accent); }
        .input-box {
          flex:1; background:none; border:none; color:var(--text);
          font-size:.88rem; line-height:1.6; resize:none; outline:none;
          min-height:38px; max-height:160px; overflow-y:auto;
        }
        .input-box::placeholder { color:var(--text3); font-family:var(--font-ui); font-size:.84rem; }
        .send-btn {
          background:var(--accent); border:none;
          border-radius:var(--r-sm); color:#fff;
          width:36px; height:36px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:.95rem; transition:all .15s;
        }
        .send-btn:hover:not(:disabled) { background:#6a58e8; }
        .send-btn:disabled { background:var(--border); cursor:not-allowed; opacity:.5; }

        /* Modal */
        .overlay {
          position:fixed; inset:0; background:#00000099;
          display:flex; align-items:center; justify-content:center; z-index:200;
        }
        .modal {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--r); padding:24px; width:460px; max-width:90vw;
        }
        .modal h3 { font-size:.95rem; margin-bottom:14px; }
        .modal-textarea {
          width:100%; height:200px;
          background:var(--bg); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text);
          padding:10px; font-size:.78rem; font-family:monospace;
          resize:none; outline:none; margin-bottom:14px;
        }
        .modal-actions { display:flex; gap:8px; justify-content:flex-end; }
        .btn-primary {
          background:var(--accent); border:none; border-radius:var(--r-sm);
          color:#fff; padding:8px 18px; font-size:.82rem; font-weight:600;
          transition:all .15s;
        }
        .btn-primary:hover { background:#6a58e8; }
        .btn-secondary {
          background:var(--surface2); border:1px solid var(--border);
          border-radius:var(--r-sm); color:var(--text2);
          padding:8px 18px; font-size:.82rem; transition:all .15s;
        }
        .btn-secondary:hover { background:var(--border); }

        /* Toast */
        .toast {
          position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--r); padding:9px 18px;
          font-size:.81rem; z-index:300; white-space:nowrap;
          animation: fadeInOut 2.6s ease forwards;
        }
        @keyframes fadeInOut {
          0% { opacity:0; transform:translateX(-50%) translateY(8px); }
          12% { opacity:1; transform:translateX(-50%) translateY(0); }
          80% { opacity:1; }
          100% { opacity:0; }
        }
      `}</style>
    </>
  )
}
