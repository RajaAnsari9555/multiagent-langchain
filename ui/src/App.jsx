import { useState, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import PipelineTracker from './components/PipelineTracker'
import ResultPanel from './components/ResultPanel'
import ParticleBackground from './components/ParticleBackground'

const INITIAL_STEPS = [
  { id: 1, label: 'Search Agent',  icon: 'search',  description: 'Querying the web for relevant sources',  status: 'idle', data: null },
  { id: 2, label: 'Reader Agent',  icon: 'reader',  description: 'Scraping and extracting page content',   status: 'idle', data: null },
  { id: 3, label: 'Writer Chain',  icon: 'writer',  description: 'Synthesising a structured report',       status: 'idle', data: null },
  { id: 4, label: 'Critic Chain',  icon: 'critic',  description: 'Reviewing and scoring the report',       status: 'idle', data: null },
]

export default function App() {
  const [steps, setSteps]         = useState(INITIAL_STEPS)
  const [pipelineState, setPipelineState] = useState('idle') // idle | running | complete | error
  const [activeTab, setActiveTab] = useState(null)
  const [topic, setTopic]         = useState('')
  const [errorMsg, setErrorMsg]   = useState('')

  const resetState = useCallback(() => {
    setSteps(INITIAL_STEPS)
    setPipelineState('idle')
    setActiveTab(null)
    setErrorMsg('')
  }, [])

  const updateStep = useCallback((stepId, patch) => {
    setSteps(prev =>
      prev.map(s => (s.id === stepId ? { ...s, ...patch } : s))
    )
  }, [])

  const handleRun = useCallback(async (inputTopic) => {
    resetState()
    setTopic(inputTopic)
    setPipelineState('running')

    try {
      const response = await fetch('/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: inputTopic }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = JSON.parse(line.slice(6))

          if (payload.status === 'error') {
            setErrorMsg(payload.message)
            setPipelineState('error')
            return
          }

          if (payload.status === 'complete') {
            setPipelineState('complete')
            // Auto-open report tab
            setActiveTab(3)
            return
          }

          if (payload.step > 0) {
            updateStep(payload.step, {
              status: payload.status,
              ...(payload.data ? { data: payload.data } : {}),
            })
            if (payload.status === 'running') {
              setActiveTab(payload.step)
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error')
      setPipelineState('error')
    }
  }, [resetState, updateStep])

  const resultsMap = {
    1: steps[0].data,
    2: steps[1].data,
    3: steps[2].data,
    4: steps[3].data,
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
          <SearchBar
            onRun={handleRun}
            disabled={pipelineState === 'running'}
            onReset={resetState}
            pipelineState={pipelineState}
          />

          {pipelineState !== 'idle' && (
            <>
              <PipelineTracker
                steps={steps}
                activeTab={activeTab}
                onTabClick={setActiveTab}
                pipelineState={pipelineState}
                topic={topic}
              />

              {errorMsg && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
                  ⚠️ {errorMsg}
                </div>
              )}

              <ResultPanel
                steps={steps}
                activeTab={activeTab}
                results={resultsMap}
                pipelineState={pipelineState}
              />
            </>
          )}
        </main>

        <footer className="text-center py-6 text-slate-600 text-xs">
          Multi-Agent Research System · Powered by GPT OSS 20B (Groq) + Tavily
        </footer>
      </div>
    </div>
  )
}
