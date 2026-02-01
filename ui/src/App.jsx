import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout, Mail, RefreshCw, Zap } from 'lucide-react'
import { clsx } from 'clsx'

// Components
import EmailList from './components/EmailList'
import EmailDetail from './components/EmailDetail'

function App() {
  const [emails, setEmails] = useState([])
  const [selectedEmailId, setSelectedEmailId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:8000/api/emails')
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

  const triggerSync = async () => {
    setSyncing(true)
    try {
      await axios.post('http://localhost:8000/api/sync')
      setTimeout(fetchEmails, 2000)
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

        <div className="p-4 space-y-1">
          <button className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium">
            <Mail size={18} />
            <span>Sent Mails</span>
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

          <div className="h-16 flex items-center justify-between px-6 border-b border-material-border">
            <h2 className="font-semibold text-lg">Inbox</h2>
            <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-full text-material-muted">
              {emails.length}
            </span>
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
