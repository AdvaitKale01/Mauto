from src.gmail_client import GmailClient
from src.database import DatabaseManager

def main():
    print("=== Mauto Email Sync ===")
    
    # 1. Init Database
    db = DatabaseManager()
    print(f"Current DB Count: {db.get_count()} emails")
    
    # 2. Init Gmail Client
    client = GmailClient()
    try:
        client.authenticate()
    except Exception as e:
        print(f"Authentication failed: {e}")
        return

    # 3. Fetch Data
    print("\nFetching recent sent emails (limit=50)...")
    try:
        emails = client.get_sent_messages(max_results=50)
        
        # 4. Store in DB
        success_count = 0
        for email in emails:
            if db.upsert_email(email):
                success_count += 1
        
        print(f"\nSync Complete.")
        print(f"Successfully synced: {success_count}/{len(emails)}")
        print(f"Total Emails in DB: {db.get_count()}")

    except Exception as e:
        print(f"Error during sync: {e}")

if __name__ == "__main__":
    main()
