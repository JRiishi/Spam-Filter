import React, { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/api/predict'
const HISTORY_KEY = 'spam_filter_history_v1'

function shortPreview(text) {
  return text.length > 60 ? text.slice(0, 57) + '...' : text
}

export default function App() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch (e) {
      console.warn('Failed to load history', e)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)))
  }, [history])

  async function handleCheck() {
    const trimmed = text.trim()
    if (!trimmed) return
    setLoading(true)
    setResult(null)
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.detail || 'Server error')
      setResult(data)
      const entry = {
        ts: new Date().toISOString(),
        label: data.label,
        prob: data.probability,
        text: trimmed,
      }
      setHistory(prev => [entry, ...prev].slice(0, 10))
    } catch (e) {
      setResult({ label: 'error', probability: 0, raw_score: 0, message: e.message })
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText('')
    setResult(null)
  }

  function handleClearHistory() {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Spam Filter
          </h1>
          <p className="text-slate-600">Powered by Machine Learning • Fast & Accurate</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 animate-slide-up">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="text-lg">✉️</span>
                Enter Message to Analyze
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={6}
                className="w-full p-4 border-2 border-slate-200 rounded-xl resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="Paste any message, email, or text here..."
              />

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handleCheck}
                  disabled={loading || !text.trim()}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Check for Spam</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  className="px-4 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Result Card */}
            {result && (
              <div className="animate-slide-up">
                {result.label === 'error' ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                        <p className="text-red-700">{result.message}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl p-6 border-2 shadow-lg transition-all ${
                    result.label === 'spam'
                      ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                      : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md ${
                        result.label === 'spam' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {result.label === 'spam' ? '🚫' : '✅'}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold mb-1 ${
                          result.label === 'spam' ? 'text-red-900' : 'text-green-900'
                        }`}>
                          {result.label === 'spam' ? 'Spam Detected' : 'Looks Safe'}
                        </h3>
                        <p className={result.label === 'spam' ? 'text-red-700' : 'text-green-700'}>
                          {result.label === 'spam' 
                            ? 'This message appears to be spam'
                            : 'This message seems legitimate'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white/60 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Confidence Level</span>
                        <span className="text-lg font-bold text-slate-900">
                          {(result.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            result.label === 'spam'
                              ? 'bg-gradient-to-r from-red-500 to-orange-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          style={{ width: `${result.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 animate-slide-up sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📜</span>
                  Recent Checks
                </h2>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">No checks yet</p>
                  </div>
                ) : (
                  history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          h.label === 'spam'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {h.label === 'spam' ? '🚫 Spam' : '✅ Safe'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(h.prob * 100).toFixed(0)}%
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 mb-1 line-clamp-2">
                        {shortPreview(h.text)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(h.ts).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          Built with FastAPI & React • ML-Powered Classification
        </div>
      </div>
    </div>
  )
}