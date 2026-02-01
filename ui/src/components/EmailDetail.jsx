import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Loader2, Copy, Send, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { clsx } from 'clsx'

export default function EmailDetail({ emailId }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    // AI State
    const [aiContext, setAiContext] = useState("I haven't heard back yet. Keep it short and polite.")
    const [generatedDraft, setGeneratedDraft] = useState("")

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
        <div className="flex h-full flex-col bg-slate-50">
            {/* Header */}
            <div className="h-16 px-6 border-b border-material-border bg-white flex items-center shadow-sm sticky top-0 z-10">
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
                                <span className="text-slate-500 text-xs">{new Date(msg.date).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="ml-11 bg-white border border-slate-200 p-5 rounded-lg rounded-tl-none shadow-sm text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                            {msg.body_text || msg.snippet}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Action Area - Floating Bottom Sheet logic */}
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all max-h-[60vh]">

                    {/* Generated Result Area */}
                    {generatedDraft && (
                        <div className="bg-slate-50 p-4 border-b border-slate-100 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase text-purple-600 tracking-wider flex items-center space-x-1">
                                    <Sparkles size={12} />
                                    <span>AI Draft</span>
                                </span>
                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <Copy size={16} />
                                </button>
                            </div>
                            <div className="prose prose-sm prose-slate max-w-none">
                                <ReactMarkdown>{generatedDraft}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Input Controls */}
                    <div className="p-3 flex items-center space-x-3 bg-white">
                        <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2 flex items-center space-x-2 border border-transparent focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <Sparkles size={18} className="text-purple-500" />
                            <input
                                type="text"
                                className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-700 placeholder-slate-400"
                                placeholder="Context: Ask for a 15min call..."
                                value={aiContext}
                                onChange={(e) => setAiContext(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !generating) handleGenerate();
                                }}
                            />
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md",
                                generating
                                    ? "bg-slate-100 text-slate-400 animate-pulse"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                            )}
                        >
                            {generating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
