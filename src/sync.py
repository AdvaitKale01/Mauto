from src.gmail_client import GmailClient
from src.database import DatabaseManager

def main(ai=None, db=None):
    print("=== Mauto Email Sync ===")
    
    # 1. Init Database
    if db is None:
        db = DatabaseManager()
    print(f"Current DB Count: {db.get_count()} emails")
    
    # 2. Init Gmail Client
    client = GmailClient()
    try:
        client.authenticate()
    except Exception as e:
        print(f"Authentication failed: {e}")
        return

    # 3. Init AI Engine (if not provided)
    if ai is None:
        from src.ai_engine import AIEngine
        ai = AIEngine()

    # 4. Fetch Data
    print("\nFetching recent sent emails (limit=50)...")
    try:
        emails = client.get_sent_messages(max_results=50)
        
        # 5. Store in DB with Classification
        success_count = 0
        for i, email in enumerate(emails):
            print(f"[{i+1}/{len(emails)}] Processing: {email['subject'][:40]}...")
            is_job = ai.classify_relevance(email['subject'], email['snippet'])
            email['is_job_related'] = 1 if is_job else 0
            
            if db.upsert_email(email):
                success_count += 1
        
        print(f"\nSync Complete.")
        print(f"Successfully synced: {success_count}/{len(emails)}")
        print(f"Total Emails in DB: {db.get_count()}")

    except Exception as e:
        print(f"Error during sync: {e}")

if __name__ == "__main__":
    main()
