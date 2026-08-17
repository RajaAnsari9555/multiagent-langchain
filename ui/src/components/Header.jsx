import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

export default function Header() {
  return (
    <header className="w-full border-b border-white/5 backdrop-blur-sm bg-black/20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30"
        >
          <Brain className="w-6 h-6 text-violet-400" />
        </motion.div>

        <div>
          <h1 className="text-lg font-semibold text-white leading-none">
            ResearchMind
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Multi-Agent AI Research System</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GPT OSS 20B (Groq)
          </span>
        </div>
      </div>
    </header>
  )
}
