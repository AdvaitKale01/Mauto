import sqlite3
import json
from src.ai_engine import AIEngine

def test_generation():
    # 1. Fetch a real email from DB
    conn = sqlite3.connect('emails.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get a sent email that is likely a cold outreach (e.g., has "Intern" or "Research" in subject)
    c.execute("SELECT * FROM emails WHERE subject LIKE '%Intern%' OR subject LIKE '%Research%' LIMIT 1")
    row = c.fetchone()
    conn.close()

    if not row:
        print("No suitable test email found in DB.")
        return

    email_data = dict(row)
    # Parse json fields back to lists if needed, though prompts usually take string representation fine
    print(f"\n--- Testing AI on Email: {email_data['subject']} ---\n")

    # 2. Init Engine
    engine = AIEngine()

    # 3. Generate
    print("\nGenerating Draft...\n")
    draft = engine.generate_follow_up(email_data)
    
    print("\n=== GENERATED DRAFT ===\n")
    print(draft)
    print("\n=======================\n")

if __name__ == "__main__":
    test_generation()
