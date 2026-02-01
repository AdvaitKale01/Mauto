from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
from src.database import DatabaseManager
from src.ai_engine import AIEngine
from src.sync import main as run_sync

app = FastAPI(title="Mauto API")

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Managers
db_manager = DatabaseManager()
ai_engine = None

def get_ai_engine():
    global ai_engine
    if ai_engine is None:
        ai_engine = AIEngine()
    return ai_engine

def sync_task():
    # Helper to run sync in background with shared engine
    engine = get_ai_engine()
    run_sync(ai=engine, db=db_manager)

class GenerateRequest(BaseModel):
    email_id: str
    context: str

class FilterRequest(BaseModel):
    prompt: str

@app.get("/api/emails")
def get_emails(limit: int = 50, offset: int = 0, is_job: bool = True):
    conn = sqlite3.connect('emails.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Ensure table exists (safeguard)
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='emails'")
    if not c.fetchone():
        conn.close()
        return []
    
    # Filter by job relatedness if requested
    query = "SELECT id, subject, sender, date, snippet, thread_id, recipients_to, recipients_cc, recipients_bcc FROM emails"
    query += " WHERE is_job_related = ?"
    query += " ORDER BY date DESC LIMIT ? OFFSET ?"
    
    c.execute(query, (1 if is_job else 0, limit, offset))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

from fastapi import Response
from src.gmail_client import GmailClient

# ...

@app.get("/api/emails/{email_id}")
def get_email_detail(email_id: str):
    # ... (existing code)
    conn = sqlite3.connect('emails.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get the specific email
    c.execute("SELECT * FROM emails WHERE id = ?", (email_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Email not found")
    
    email = dict(row)
    
    # Get the full thread
    c.execute("SELECT * FROM emails WHERE thread_id = ? ORDER BY date ASC", (email['thread_id'],))
    thread_rows = c.fetchall()
    conn.close()
    
    return {
        "email": email,
        "thread": [dict(r) for r in thread_rows]
    }

@app.get("/api/attachments/{message_id}/{attachment_id}")
def get_attachment(message_id: str, attachment_id: str):
    client = GmailClient()
    try:
        data = client.get_attachment_data(message_id, attachment_id)
        if not data:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # Determine mime type ?? For now generic or trust browser
        # Ideally we pass it in query param or lookup in DB, but simple blob return works for images
        return Response(content=data)
    except Exception as e:
        print(f"Error fetching attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_task)
    return {"status": "Sync started in background"}

@app.post("/api/generate")
def generate_draft(req: GenerateRequest):
    conn = sqlite3.connect('emails.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM emails WHERE id = ?", (req.email_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Email not found")

    engine = get_ai_engine()
    draft = engine.generate_follow_up(dict(row), context=req.context)
    
    return {"draft": draft}

@app.post("/api/filter")
def filter_emails(req: FilterRequest):
    conn = sqlite3.connect('emails.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    # Get all emails for context (simplified, might want to limit to current view)
    c.execute("SELECT id, subject, sender, date FROM emails ORDER BY date DESC LIMIT 100")
    emails = [dict(r) for r in c.fetchall()]
    conn.close()
    
    engine = get_ai_engine()
    matching_ids = engine.filter_emails(emails, req.prompt)
    return {"matching_ids": matching_ids}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
