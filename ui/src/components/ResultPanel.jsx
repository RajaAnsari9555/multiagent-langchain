import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Search, BookOpen, PenLine, MessageSquare, Copy, Check, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'

const TAB_CONFIG = {
  1: { label: 'Search Results', icon: Search,      color: 'violet' },
  2: { label: 'Scraped Content', icon: BookOpen,   color: 'blue'   },
  3: { label: 'Research Report', icon: PenLine,    color: 'emerald'},
  4: { label: 'Critic Review',   icon: MessageSquare, color: 'amber' },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <motion.button
      onClick={copy}
      whileTap={{ scale: 0.9 }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors"
    >
      <AnimatePresence mode="wait">
        {copied
          ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-emerald-400"><Check className="w-3.5 h-3.5" />Copied</motion.span>
          : <motion.span key="copy"  initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1"><Copy  className="w-3.5 h-3.5" />Copy</motion.span>
        }
      </AnimatePresence>
    </motion.button>
  )
}

function SkeletonLoader() {
  return (
    <div className="space-y-3 p-4">
      {[100, 85, 90, 70, 95, 75].map((w, i) => (
        <motion.div
          key={i}
          className="h-3 rounded-full bg-white/5"
          style={{ width: `${w}%` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  )
}

function CriticScore({ text }) {
  const match = text?.match(/Score:\s*(\d+)\/10/)
  if (!match) return null
  const score = parseInt(match[1])
  const pct   = (score / 10) * 100
  const color  = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="32" cy="32" r="26" fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 26}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - pct / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-white">{score}</div>
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-1">Quality Score</div>
        <div className="text-2xl font-bold text-white">{score}<span className="text-slate-500 text-base font-normal">/10</span></div>
      </div>
    </div>
  )
}

export default function ResultPanel({ steps, activeTab, results, pipelineState }) {
  if (!activeTab) return null

  const cfg       = TAB_CONFIG[activeTab]
  const Icon      = cfg.icon
  const content   = results[activeTab]
  const stepState = steps[activeTab - 1]?.status
  const isRunning = stepState === 'running'

  const colorMap = {
    violet: 'text-violet-400',
    blue:   'text-blue-400',
    emerald:'text-emerald-400',
    amber:  'text-amber-400',
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-[#13132a]/80 backdrop-blur overflow-hidden"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${colorMap[cfg.color]}`} />
            <span className="text-sm font-medium text-white">{cfg.label}</span>
          </div>
          {content && <CopyButton text={content} />}
        </div>

        {/* Panel body */}
        <div className="max-h-130 overflow-y-auto">
          {isRunning && !content ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-slate-400 text-sm">Agent is working…</p>
              <SkeletonLoader />
            </div>
          ) : content ? (
            <div className="p-5">
              {/* Critic score widget */}
              {activeTab === 4 && <CriticScore text={content} />}

              <div className="prose prose-sm prose-invert max-w-none
                prose-headings:text-white prose-headings:font-semibold
                prose-p:text-slate-300 prose-p:leading-relaxed
                prose-strong:text-white
                prose-li:text-slate-300
                prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10
                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                prose-hr:border-white/10
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  children={String(content)}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-slate-600 text-sm">
              Waiting for agent to start…
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
