from mlx_lm import load, generate
from src.prompts import FOLLOW_UP_TEMPLATE

class AIEngine:
    def __init__(self, model_id="mlx-community/Qwen2.5-3B-Instruct-4bit"):
        print(f"DEBUG: Initializing AIEngine with model: {model_id}")
        print("DEBUG: Calling load()...")
        self.model, self.tokenizer = load(model_id)
        print("DEBUG: Model loaded successfully.")

    def generate_follow_up(self, email_data, context="I haven't heard back yet. Keep it short."):
        """
        Generates a follow up based on a structured email dictionary from the DB.
        """
        # Format thread content
        thread_content = f"Subject: {email_data['subject']}\nFrom: {email_data['sender']}\nBody:\n{email_data['body_text'][:2000]}" # Truncate for safety
        
        prompt = FOLLOW_UP_TEMPLATE.format(
            recipient=email_data['recipients_to'],
            subject=email_data['subject'],
            date=email_data['date'],
            thread_content=thread_content,
            context=context
        )

        messages = [{"role": "user", "content": prompt}]
        formatted_prompt = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

        response = generate(
            self.model, 
            self.tokenizer, 
            prompt=formatted_prompt, 
            verbose=True, 
            max_tokens=500
        )
        return response

    def classify_relevance(self, subject, snippet):
        """
        Hybrid classifier: Keywords first, then LLM.
        """
        text = (subject + " " + snippet).lower()
        
        # 1. Obvious Job Keywords (High Confidence YES)
        job_keywords = [
            "job", "internship", "intern ", "career", "vacancy", "opening", 
            "hiring", "recruitment", "application", "applied", "position", 
            "role", "candidate", "interview", "offer", "resume", "cv ", "linkedin",
            "handshake", "workday", "greenhouse", "lever", "smartrecruiters",
            "thank you for applying", "your application", "employment"
        ]
        
        # 2. Obvious Non-Job Keywords (High Confidence NO)
        trash_keywords = [
            "newsletter", "unsubscribe", "sale", "discount", "promotional",
            "subscription", "billing", "receipt", "verification code", "otp",
            "marketing", "advertisement", "daily digest"
        ]

        # Heuristic Scoring
        job_score = sum(1 for kw in job_keywords if kw in text)
        trash_score = sum(1 for kw in trash_keywords if kw in text)

        # Decision Logic
        if job_score >= 2 and trash_score == 0:
            return True # High confidence Job
        if trash_score >= 2 and job_score == 0:
            return False # High confidence Irrelevant
            
        # 3. Ambiguous - Use LLM
        print(f"Ambiguous email (Score: J{job_score}/T{trash_score}), using LLM...")
        from src.prompts import CLASSIFICATION_TEMPLATE
        prompt = CLASSIFICATION_TEMPLATE.format(subject=subject, snippet=snippet)
        messages = [{"role": "user", "content": prompt}]
        formatted_prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        
        response = generate(self.model, self.tokenizer, prompt=formatted_prompt, max_tokens=10).strip().upper()
        return "YES" in response

    def filter_emails(self, emails_metadata, prompt):
        """
        Filters a list of email metadata based on a natural language prompt.
        emails_metadata: List of dicts with {id, subject, date, sender}
        """
        from src.prompts import FILTER_TEMPLATE
        import json
        
        metadata_str = "\n".join([f"- ID: {e['id']}, To: {e['sender']}, Sub: {e['subject']}, Date: {e['date']}" for e in emails_metadata])
        full_prompt = FILTER_TEMPLATE.format(prompt=prompt, metadata_list=metadata_str)
        
        messages = [{"role": "user", "content": full_prompt}]
        formatted_prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        
        response = generate(self.model, self.tokenizer, prompt=formatted_prompt, max_tokens=1000).strip()
        
        # Try to extract JSON list
        try:
            # Look for [ ... ]
            start = response.find('[')
            end = response.rfind(']') + 1
            if start != -1 and end != -1:
                return json.loads(response[start:end])
            return []
        except:
            return []
