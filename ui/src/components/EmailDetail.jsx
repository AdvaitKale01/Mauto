import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Loader2, Copy, Send, User, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { clsx } from 'clsx'

export default function EmailDetail({ emailId }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    // AI State
    const [aiContext, setAiContext] = useState("I haven't heard back yet. Keep it short and polite.")
    const [generatedDraft, setGeneratedDraft] = useState("")

    // Attachment Preview State
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewType, setPreviewType] = useState(null)
    const [previewName, setPreviewName] = useState(null)
    const [sidebarWidth, setSidebarWidth] = useState(400)
    const [isResizing, setIsResizing] = useState(false)

    const handleAttachmentClick = (msgId, att) => {
        const url = `http://localhost:8000/api/attachments/${msgId}/${att.attachmentId}`
        setPreviewUrl(url)
        setPreviewType(att.mimeType)
        setPreviewName(att.filename)
    }

    // Resize Handler
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return
            const newWidth = window.innerWidth - e.clientX
            if (newWidth > 300 && newWidth < 800) { // Min/Max constraints
                setSidebarWidth(newWidth)
            }
        }
        const handleMouseUp = () => setIsResizing(false)

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true)
            setGeneratedDraft("")
            try {
                const res = await axios.get(`http://localhost:8000/api/emails/${emailId}`)
                setData(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        if (emailId) fetchDetail()
    }, [emailId])

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            const res = await axios.post('http://localhost:8000/api/generate', {
                email_id: emailId,
                context: aiContext
            })
            setGeneratedDraft(res.data.draft)
        } catch (err) {
            console.error(err)
            setGeneratedDraft("Error generating draft.")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-material-primary" size={32} />
            </div>
        )
    }

    if (!data) return null

    // Last message typically the one we want to reply to
    const subject = data.email.subject;

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden relative">
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-75" style={{ marginRight: previewUrl ? `${sidebarWidth}px` : '0' }}>
                {/* Header */}
                <div className="h-16 px-6 border-b border-material-border bg-white flex items-center shadow-sm sticky top-0 z-10 shrink-0">
                    <div className="flex-1 truncate">
                        <h2 className="font-bold text-lg text-slate-800 truncate">{subject}</h2>
                    </div>
                </div>

                {/* Thread Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                    {data.thread.map((msg, idx) => (
                        <div key={msg.id} className="flex flex-col space-y-3">
                            {/* Meta Header */}
                            <div className="flex items-center space-x-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase shadow-sm">
                                    {msg.sender ? msg.sender[0] : <User size={14} />}
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-slate-900 block">{msg.sender}</span>
                                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                                        <span>{new Date(msg.date).toLocaleString()}</span>
                                        {/* Recipient Details */}
                                        {(() => {
                                            try {
                                                const toIds = JSON.parse(msg.recipients_to || '[]');
                                                const ccIds = JSON.parse(msg.recipients_cc || '[]');
                                                const bccIds = JSON.parse(msg.recipients_bcc || '[]');
                                                const RecipientChip = ({ email, type }) => {
                                                    const [menuOpen, setMenuOpen] = useState(false)
                                                    const [copied, setCopied] = useState(false)
                                                    const handleCopy = (e) => {
                                                        e.stopPropagation()
                                                        navigator.clipboard.writeText(email)
                                                        setCopied(true)
                                                        setTimeout(() => { setCopied(false); setMenuOpen(false) }, 1500)
                                                    }
                                                    return (
                                                        <div className="relative inline-block">
                                                            <div onClick={() => setMenuOpen(!menuOpen)} className={clsx("px-2 py-0.5 rounded-md border text-[11px] font-medium cursor-pointer transition-colors flex items-center space-x-1 select-none", type === 'bcc' ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200")}>
                                                                <span>{email}</span>
                                                            </div>
                                                            {menuOpen && (<><div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} /><div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"><button onClick={handleCopy} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700 hover:text-blue-600">{copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}<span>{copied ? "Copied!" : "Copy Email"}</span></button></div></>)}
                                                        </div>
                                                    )
                                                }
                                                const Row = ({ label, emails, type }) => {
                                                    if (!emails || emails.length === 0) return null
                                                    return (<div className="flex items-start gap-2"><span className={clsx("font-semibold w-6 mt-1 text-right", type === 'bcc' && "text-amber-600")}>{label}:</span><div className="flex flex-wrap gap-1.5 flex-1">{emails.map(email => <RecipientChip key={email} email={email} type={type} />)}</div></div>)
                                                }
                                                return (<div className="flex flex-col mt-2 w-full gap-y-1.5 text-[11px]"><Row label="To" emails={toIds} type="to" /><Row label="Cc" emails={ccIds} type="cc" /><Row label="Bcc" emails={bccIds} type="bcc" /></div>)
                                            } catch (e) { return null }
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="mt-2 bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-sm leading-relaxed text-slate-700 overflow-hidden">
                                {msg.body_html ? (<div className="email-content" dangerouslySetInnerHTML={{ __html: msg.body_html }} />) : (<div className="whitespace-pre-wrap">{msg.body_text || msg.snippet}</div>)}
                                {/* Attachments */}
                                {(() => {
                                    try {
                                        const attachments = JSON.parse(msg.attachments || '[]');
                                        if (attachments.length === 0) return null;
                                        return (
                                            <div className="mt-4 pt-3 border-t border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Attachments ({attachments.length})</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {attachments.map((att, i) => (
                                                        <div key={i} onClick={() => handleAttachmentClick(msg.id, att)} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md p-2 hover:bg-slate-100 transition-colors cursor-pointer" title="Click to preview">
                                                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-[10px] uppercase">{att.filename.split('.').pop()}</div>
                                                            <div className="flex flex-col max-w-[150px]"><span className="text-xs font-medium text-slate-700 truncate" title={att.filename}>{att.filename}</span><span className="text-[10px] text-slate-400">{att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${(att.size / 1024).toFixed(1)} KB`}</span></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    } catch (e) { return null }
                                })()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Action Area */}
                <div className="absolute bottom-6 left-6 transition-all duration-75" style={{ right: previewUrl ? `${sidebarWidth + 24}px` : '24px' }}>
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all max-h-[60vh]">
                        {generatedDraft && (
                            <div className="bg-slate-50 p-4 border-b border-slate-100 max-h-64 overflow-y-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase text-purple-600 tracking-wider flex items-center space-x-1"><Sparkles size={12} /><span>AI Draft</span></span>
                                    <button className="text-slate-400 hover:text-slate-600 transition-colors"><Copy size={16} /></button>
                                </div>
                                <div className="prose prose-sm prose-slate max-w-none"><ReactMarkdown>{generatedDraft}</ReactMarkdown></div>
                            </div>
                        )}
                        <div className="p-3 flex items-center space-x-3 bg-white">
                            <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2 flex items-center space-x-2 border border-transparent focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Sparkles size={18} className="text-purple-500" />
                                <input type="text" className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-700 placeholder-slate-400" placeholder="Context: Ask for a 15min call..." value={aiContext} onChange={(e) => setAiContext(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !generating) handleGenerate(); }} />
                            </div>
                            <button onClick={handleGenerate} disabled={generating} className={clsx("w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md", generating ? "bg-slate-100 text-slate-400 animate-pulse" : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105")}>
                                {generating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attachment Sidebar */}
            {previewUrl && (
                <div className="absolute top-0 right-0 bottom-0 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col" style={{ width: `${sidebarWidth}px` }}>
                    {/* Drag Handle */}
                    <div onMouseDown={() => setIsResizing(true)} className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 transition-colors z-50" />

                    <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50 shrink-0">
                        <span className="font-semibold text-sm truncate" title={previewName}>{previewName}</span>
                        <button onClick={() => setPreviewUrl(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">✕</button>
                    </div>
                    <div className="flex-1 bg-slate-100 overflow-hidden flex items-center justify-center p-4 relative">
                        {previewType?.startsWith('image/') ? (<img src={previewUrl} className="max-w-full max-h-full object-contain shadow-sm bg-white" alt="Preview" />) : previewType === 'application/pdf' ? (<iframe src={previewUrl} className="w-full h-full bg-white shadow-sm" title="PDF Preview" />) : (<div className="text-center text-slate-500"><p className="mb-2">Preview not available for this type.</p><a href={previewUrl} download={previewName} className="text-blue-600 underline text-sm hover:text-blue-700">Download File </a></div>)}
                    </div>
                </div>
            )}
        </div>
    )
}
