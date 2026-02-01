import { clsx } from 'clsx'

export default function EmailList({ emails, selectedIds, onSelect }) {
    const selectedId = selectedIds[0]

    return (
        <>
            {emails.map((email) => (
                <div
                    key={email.id}
                    onClick={() => onSelect(email.id)}
                    className={clsx(
                        "p-4 rounded-xl cursor-pointer border transition-all duration-200 shadow-sm",
                        selectedId === email.id
                            ? "bg-white border-blue-400 ring-2 ring-blue-100 shadow-md transform -translate-y-0.5"
                            : "bg-white border-material-border hover:border-blue-200 hover:shadow-md"
                    )}
                >
                    <div className="flex justify-between items-start mb-1.5">
                        <h3 className={clsx(
                            "font-semibold text-sm truncate w-3/4",
                            selectedId === email.id ? "text-blue-700" : "text-slate-800"
                        )}>{email.subject || '(No Subject)'}</h3>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                            {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>

                    <div className="flex items-center mb-2 overflow-hidden">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 mr-2 flex-shrink-0">
                            To
                        </div>
                        <p className="text-xs text-slate-600 truncate font-medium">
                            {(() => {
                                try {
                                    const to = JSON.parse(email.recipients_to || '[]');
                                    const bcc = JSON.parse(email.recipients_bcc || '[]');

                                    let display = to.join(', ') || 'Me/Undisclosed';
                                    if (bcc.length > 0) {
                                        display += ` (+${bcc.length} Bcc)`;
                                    }
                                    return display;
                                } catch (e) {
                                    return email.recipients_to || '...';
                                }
                            })()}
                        </p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {email.snippet}
                    </p>
                </div>
            ))}
        </>
    )
}
