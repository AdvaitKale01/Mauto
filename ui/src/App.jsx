import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout, Mail, RefreshCw, Zap, Briefcase, Trash2, Search, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

// Components
import EmailList from './components/EmailList'
import EmailDetail from './components/EmailDetail'

function App() {
  const [emails, setEmails] = useState([])
  const [selectedEmailId, setSelectedEmailId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('jobs')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtering, setFiltering] = useState(false)

  const fetchEmails = async (category = activeCategory) => {
    setLoading(true)
    setSelectedEmailId(null)
    try {
      const isJob = category === 'jobs' ? 'true' : 'false'
      const res = await axios.get(`http://localhost:8000/api/emails?is_job=${isJob}`)
      setEmails(res.data)
    } catch (err) {
      console.error("Error fetching emails:", err)
    } finally {
      setLoading(false)
    }
  }

  // Resize State
  const [navWidth, setNavWidth] = useState(250)
  const [listWidth, setListWidth] = useState(380)
  const [resizingNav, setResizingNav] = useState(false)
  const [resizingList, setResizingList] = useState(false)

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setFiltering(true)
      try {
        const res = await axios.post('http://localhost:8000/api/filter', { prompt: searchQuery })
        const matchingIds = res.data.matching_ids || []
        setEmails(prev => prev.filter(email => matchingIds.includes(email.id)))
      } catch (err) {
        console.error("Filter error:", err)
      } finally {
        setFiltering(false)
      }
    } else if (e.key === 'Escape' || (e.key === 'Enter' && !searchQuery.trim())) {
      setSearchQuery('')
      fetchEmails()
    }
  }

  // Effect to switch category
  useEffect(() => {
    fetchEmails(activeCategory)
  }, [activeCategory])

  const triggerSync = async () => {
    setSyncing(true)
    try {
      await axios.post('http://localhost:8000/api/sync')
      // Poll or wait for sync (classification takes time)
      setTimeout(() => fetchEmails(activeCategory), 15000)
    } catch (err) {
      console.error("Error syncing:", err)
    } finally {
      setSyncing(false)
    }
  }

  // Global Resize Handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingNav) {
        const newWidth = e.clientX
        if (newWidth > 150 && newWidth < 400) setNavWidth(newWidth)
      }
      if (resizingList) {
        // List width is effectively mouse X minus nav width
        const newWidth = e.clientX - navWidth
        if (newWidth > 250 && newWidth < 600) setListWidth(newWidth)
      }
    }
    const handleMouseUp = () => {
      setResizingNav(false)
      setResizingList(false)
    }

    if (resizingNav || resizingList) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
    } else {
      document.body.style.cursor = 'default'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [resizingNav, resizingList, navWidth])

  useEffect(() => {
    fetchEmails()
  }, [])

  return (
    <div className="flex h-screen w-full bg-material-bg text-material-text overflow-hidden select-none">
      {/* Sidebar (Nav) */}
      <div
        className="bg-material-surface border-r border-material-border flex flex-col relative shrink-0"
        style={{ width: navWidth }}
      >
        {/* Resize Handle A */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-20"
          onMouseDown={() => setResizingNav(true)}
        />

        <div className="h-16 flex items-center px-6 border-b border-material-border">
          <div className="flex items-center space-x-2 font-bold text-xl text-material-primary">
            <Zap size={24} fill="currentColor" />
            <span>Mauto</span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={() => setActiveCategory('jobs')}
            className={clsx(
              "flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
              activeCategory === 'jobs' ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Briefcase size={18} />
            <span>Job Opportunities</span>
          </button>

          <button
            onClick={() => setActiveCategory('others')}
            className={clsx(
              "flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
              activeCategory === 'others' ? "bg-slate-600 text-white shadow-md shadow-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Trash2 size={18} />
            <span>Irrelevant</span>
          </button>
        </div>

        <div className="mt-auto p-4 border-t border-material-border">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className={clsx(
              "flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg font-medium transition-all text-sm",
              syncing
                ? "bg-material-muted/10 text-material-muted cursor-not-allowed"
                : "bg-white border border-material-border hover:bg-slate-50 text-material-text shadow-sm"
            )}
          >
            <RefreshCw size={16} className={clsx(syncing && "animate-spin")} />
            <span>{syncing ? "Syncing..." : "Sync Gmail"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email List Column */}
        <div
          className="border-r border-material-border bg-material-surface flex flex-col relative shrink-0"
          style={{ width: listWidth }}
        >
          {/* Resize Handle B */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-20"
            onMouseDown={() => setResizingList(true)}
          />

          <div className="h-16 flex items-center justify-between px-6 border-b border-material-border shrink-0">
            <h2 className="font-semibold text-lg">{activeCategory === 'jobs' ? 'Inbox' : 'Irrelevant'}</h2>
            <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-full text-material-muted">
              {emails.length}
            </span>
          </div>

          {/* AI Search Bar */}
          <div className="px-4 py-3 border-b border-material-border bg-white shadow-sm">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {filtering ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Search size={14} className="text-slate-400" />}
              </div>
              <input
                type="text"
                placeholder='Prompt: "more than 7 days ago"...'
                className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-blue-100 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 space-y-3">
            <EmailList
              emails={emails}
              selectedIds={[selectedEmailId]}
              onSelect={setSelectedEmailId}
            />
          </div>
        </div>

        {/* Detail View Column */}
        <div className="flex-1 bg-material-bg flex flex-col overflow-hidden relative">
          {selectedEmailId ? (
            <EmailDetail emailId={selectedEmailId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-material-muted space-y-4">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                <Mail size={32} />
              </div>
              <p className="font-medium">Select an email to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
