import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, PenLine, MessageSquare, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'

const ICONS = {
  search: Search,
  reader: BookOpen,
  writer: PenLine,
  critic: MessageSquare,
}

const STATUS_CONFIG = {
  idle:    { color: 'text-slate-500',   bg: 'bg-slate-800/50',   border: 'border-slate-700/50'  },
  running: { color: 'text-violet-400',  bg: 'bg-violet-900/30',  border: 'border-violet-500/50' },
  done:    { color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  error:   { color: 'text-red-400',     bg: 'bg-red-900/20',     border: 'border-red-500/30'    },
}

function StepIcon({ status, size = 'w-5 h-5' }) {
  if (status === 'running') return <Loader2 className={`${size} animate-spin text-violet-400`} />
  if (status === 'done')    return <CheckCircle2 className={`${size} text-emerald-400`} />
  if (status === 'error')   return <AlertCircle className={`${size} text-red-400`} />
  return <Circle className={`${size} text-slate-600`} />
}

export default function PipelineTracker({ steps, activeTab, onTabClick, pipelineState, topic }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Topic badge */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Search className="w-3.5 h-3.5" />
        Researching:{' '}
        <span className="text-violet-300 font-medium">{topic}</span>
        {pipelineState === 'complete' && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
            <CheckCircle2 className="w-3 h-3" /> Complete
          </span>
        )}
      </div>

      {/* Steps row */}
      <div className="grid grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const cfg = STATUS_CONFIG[step.status]
          const Icon = ICONS[step.icon]
          const isActive = activeTab === step.id

          return (
            <motion.button
              key={step.id}
              onClick={() => step.data && onTabClick(step.id)}
              disabled={!step.data}
              whileHover={step.data ? { scale: 1.02 } : {}}
              whileTap={step.data ? { scale: 0.98 } : {}}
              className={[
                'relative rounded-xl border p-3 text-left transition-all duration-300',
                cfg.bg, cfg.border,
                isActive ? 'ring-1 ring-violet-500/40' : '',
                step.data ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              {/* Running glow */}
              {step.status === 'running' && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-violet-500/10"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-3 h-px bg-white/10 z-10" />
              )}

              <div className="relative flex items-start gap-2">
                <div className={`p-1.5 rounded-lg ${step.status === 'running' ? 'bg-violet-500/20' : step.status === 'done' ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-semibold ${cfg.color}`}>{step.label}</span>
                    <StepIcon status={step.status} size="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{step.description}</p>
                </div>
              </div>

              {/* Active indicator */}
              {isActive && step.data && (
                <motion.div
                  layoutId="activeStep"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-b-xl"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-violet-600 to-fuchsia-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{
            width: `${(steps.filter(s => s.status === 'done').length / steps.length) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}
