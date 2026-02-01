import os.path
import pickle
import base64
import email.utils
import datetime
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailClient:
    def __init__(self, credentials_path='credentials.json', token_path='token.pickle'):
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.service = None

    def authenticate(self):
        creds = None
        if os.path.exists(self.token_path):
            with open(self.token_path, 'rb') as token:
                creds = pickle.load(token)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_path):
                    raise FileNotFoundError(f"Credentials file not found at {self.credentials_path}")
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, SCOPES)
                creds = flow.run_local_server(port=0)
            
            with open(self.token_path, 'wb') as token:
                pickle.dump(creds, token)

        self.service = build('gmail', 'v1', credentials=creds)
        print("Authentication successful.")

    def get_sent_messages(self, max_results=100):
        """Gets a list of messages from the user's sent box."""
        if not self.service:
            raise Exception("Gmail Client not authenticated.")

        messages_list = []
        next_page_token = None
        
        # Initial fetch
        request = self.service.users().messages().list(userId='me', labelIds=['SENT'], maxResults=min(max_results, 500))
        
        while request is not None and len(messages_list) < max_results:
            try:
                response = request.execute()
                messages = response.get('messages', [])
                if not messages:
                    break
                    
                messages_list.extend(messages)
                
                # Check if we need more
                if len(messages_list) >= max_results:
                    messages_list = messages_list[:max_results]
                    break

                request = self.service.users().messages().list_next(previous_request=request, previous_response=response)
            except Exception as e:
                print(f"Error listing messages: {e}")
                break

        print(f"Found {len(messages_list)} messages. Fetching details...")
        
        full_messages = []
        for msg_meta in messages_list:
            try:
                full_msg = self._fetch_message_details(msg_meta['id'])
                if full_msg:
                    full_messages.append(full_msg)
            except Exception as e:
                print(f"Error fetching message {msg_meta['id']}: {e}")
        
        return full_messages



    def _fetch_message_details(self, msg_id):
        msg = self.service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        
        payload = msg.get('payload', {})
        headers = payload.get('headers', [])
        
        # Extract Headers
        subject = self._get_header(headers, 'Subject')
        sender = self._get_header(headers, 'From')
        to_recipients = self._get_recipients(headers, 'To')
        cc_recipients = self._get_recipients(headers, 'Cc')
        bcc_recipients = self._get_recipients(headers, 'Bcc')
        raw_date = self._get_header(headers, 'Date')

        # Normalize Date
        try:
            parsed_date = email.utils.parsedate_to_datetime(raw_date)
            date = parsed_date.isoformat()
        except Exception:
            date = raw_date # Fallback
        
        # Parse Body and Attachments
        body_text, body_html = self._parse_body(payload)
        attachments = self._parse_attachments(payload)

        return {
            'id': msg['id'],
            'threadId': msg['threadId'],
            'snippet': msg.get('snippet', ''),
            'subject': subject,
            'sender': sender,
            'to': to_recipients,
            'cc': cc_recipients,
            'bcc': bcc_recipients,
            'date': date,
            'body_text': body_text,
            'body_html': body_html,
            'attachments': attachments
        }

    def _get_header(self, headers, name):
        return next((h['value'] for h in headers if h['name'].lower() == name.lower()), '')

    def _get_recipients(self, headers, name):
        """Parses 'Name <email>, ...' into a list of strings."""
        val = self._get_header(headers, name)
        if not val:
            return []
        return [email.strip() for email in val.split(',') if email.strip()]

    def _parse_body(self, payload):
        text_body = ""
        html_body = ""

        def decode_data(data):
            if not data: return ""
            return base64.urlsafe_b64decode(data).decode('utf-8')

        if 'parts' in payload:
            for part in payload['parts']:
                mime_type = part.get('mimeType')
                body_data = part.get('body', {}).get('data', '')
                
                if mime_type == 'text/plain':
                    text_body += decode_data(body_data)
                elif mime_type == 'text/html':
                    html_body += decode_data(body_data)
                elif mime_type and mime_type.startswith('multipart/'):
                    # Recursive for nested multipart
                    t, h = self._parse_body(part)
                    text_body += t
                    html_body += h
        else:
            # Single part message
            mime_type = payload.get('mimeType')
            body_data = payload.get('body', {}).get('data', '')
            if mime_type == 'text/plain':
                text_body = decode_data(body_data)
            elif mime_type == 'text/html':
                html_body = decode_data(body_data)

        return text_body, html_body

    def _parse_attachments(self, payload):
        attachments = []
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('filename') and part.get('body', {}).get('attachmentId'):
                    attachments.append({
                        'filename': part['filename'],
                        'mimeType': part['mimeType'],
                        'attachmentId': part['body']['attachmentId'],
                        'size': part['body'].get('size', 0)
                    })
        return attachments

    def get_attachment_data(self, msg_id, attachment_id):
        """Fetches the raw attachment data given message ID and attachment ID."""
        if not self.service:
            # Auto-authenticate if needed (assuming single user context)
            self.authenticate()
            
        attachment = self.service.users().messages().attachments().get(
            userId='me', messageId=msg_id, id=attachment_id
        ).execute()
        
        data = attachment.get('data')
        if data:
            return base64.urlsafe_b64decode(data)
        return None
