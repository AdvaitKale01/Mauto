from src.gmail_client import GmailClient

def main():
    print("Initializing Mauto - Gmail Integration...")
    
    client = GmailClient()
    
    try:
        client.authenticate()
        
        print("\n=== Fetching Last 5 Sent Emails ===")
        sent_mails = client.get_sent_messages(limit=5)
        
        for i, mail in enumerate(sent_mails, 1):
            print(f"\nEmail #{i}")
            print(f"To: {mail['to']}")
            print(f"Subject: {mail['subject']}")
            print(f"Date: {mail['date']}")
            print(f"Snippet: {mail['snippet'][:100]}...")
            
    except FileNotFoundError as e:
        print(f"\nERROR: {e}")
        print("Please place your 'credentials.json' file in the root directory.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    main()
