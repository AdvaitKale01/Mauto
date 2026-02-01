import sqlite3
import json

def inspect_db():
    conn = sqlite3.connect('emails.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    print("=== DB Inspection ===\n")
    
    # 1. Threading Check
    print("--- Threading ---")
    c.execute('SELECT thread_id, count(*) as cnt FROM emails GROUP BY thread_id ORDER BY cnt DESC LIMIT 3')
    threads = c.fetchall()
    for t in threads:
        print(f"Thread {t['thread_id']}: {t['cnt']} emails")

    # 2. Attachments Check
    print("\n--- Attachments ---")
    c.execute("SELECT id, subject, attachments FROM emails WHERE attachments != '[]' LIMIT 3")
    att_emails = c.fetchall()
    if att_emails:
        for e in att_emails:
            print(f"Msg: {e['subject']}")
            print(f"Attachments: {e['attachments']}")
    else:
        print("No attachments found in the synced batch.")

    # 3. CC/BCC Check
    print("\n--- CC/BCC ---")
    c.execute("SELECT id, subject, recipients_cc, recipients_bcc FROM emails WHERE recipients_cc != '[]' OR recipients_bcc != '[]' LIMIT 3")
    cc_emails = c.fetchall()
    if cc_emails:
        for e in cc_emails:
            print(f"Msg: {e['subject']}")
            print(f"CC: {e['recipients_cc']}")
            print(f"BCC: {e['recipients_bcc']}")
    else:
        print("No emails with CC/BCC in this batch.")

    conn.close()

if __name__ == "__main__":
    inspect_db()
