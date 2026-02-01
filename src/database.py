import sqlite3
import json
import os

class DatabaseManager:
    def __init__(self, db_path='emails.db'):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Enable WAL mode for better concurrency
        c.execute('PRAGMA journal_mode=WAL;')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                thread_id TEXT,
                date DATETIME,
                sender TEXT,
                recipients_to TEXT,
                recipients_cc TEXT,
                recipients_bcc TEXT,
                subject TEXT,
                body_text TEXT,
                body_html TEXT,
                attachments TEXT,
                snippet TEXT,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Index for faster thread reconstruction
        c.execute('CREATE INDEX IF NOT EXISTS idx_thread_id ON emails(thread_id);')
        
        conn.commit()
        conn.close()

    def upsert_email(self, email_data):
        """
        Insert or update an email record.
        email_data should be a dictionary matching the schema.
        lists/dicts (recipients, attachments) should be passed as Python objects
        and will be JSON dumped here.
        """
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # Helper to safely serialize JSON
        def to_json(obj):
            return json.dumps(obj) if obj is not None else '[]'

        try:
            c.execute('''
                INSERT OR REPLACE INTO emails (
                    id, thread_id, date, sender, 
                    recipients_to, recipients_cc, recipients_bcc, 
                    subject, body_text, body_html, 
                    attachments, snippet
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                email_data.get('id'),
                email_data.get('threadId'),
                email_data.get('date'),
                email_data.get('sender'),
                to_json(email_data.get('to', [])),
                to_json(email_data.get('cc', [])),
                to_json(email_data.get('bcc', [])),
                email_data.get('subject'),
                email_data.get('body_text', ''),
                email_data.get('body_html', ''),
                to_json(email_data.get('attachments', [])),
                email_data.get('snippet', '')
            ))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving email {email_data.get('id')}: {e}")
            return False
        finally:
            conn.close()

    def get_count(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM emails')
        count = c.fetchone()[0]
        conn.close()
        return count
