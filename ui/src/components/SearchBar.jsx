import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, RotateCcw, Loader2 } from 'lucide-react'

const SUGGESTIONS = [
  'Quantum computing breakthroughs 2025',
  'Latest advances in CRISPR gene editing',
  'AI safety research overview',
  'Renewable energy trends 2025',
  'Large language model architectures',
]

export default function SearchBar({ onRun, disabled, onReset, pipelineState }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim() && !disabled) onRun(value.trim())
  }

  const handleSuggestion = (s) => {
    setValue(s)
    if (!disabled) onRun(s)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Hero text */}
      {pipelineState === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-2 pb-4"
        >
          <h2 className="text-4xl font-bold text-white">
            What should we{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              research
            </span>{' '}
            today?
          </h2>
          <p className="text-slate-400 text-sm">
            4 AI agents working in sequence — search, scrape, write, critique.
          </p>
        </motion.div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          animate={focused ? { boxShadow: '0 0 0 2px rgba(139,92,246,0.5)' } : {}}
          className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter a research topic..."
              className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm"
              disabled={disabled}
            />

            <AnimatePresence mode="wait">
              {disabled ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/30 text-violet-300 text-sm"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running…
                </motion.div>
              ) : pipelineState !== 'idle' ? (
                <motion.button
                  key="reset"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  New
                </motion.button>
              ) : (
                <motion.button
                  key="run"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="submit"
                  disabled={!value.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Research
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </form>

      {/* Suggestion chips */}
      {pipelineState === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSuggestion(s)}
              className="px-3 py-1.5 rounded-full text-xs border border-violet-500/20 bg-violet-500/5 text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/40 transition-all"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
