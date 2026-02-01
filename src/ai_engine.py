from mlx_lm import load, generate
from src.prompts import FOLLOW_UP_TEMPLATE

class AIEngine:
    def __init__(self, model_id="mlx-community/Qwen2.5-14B-Instruct-4bit"):
        print(f"Loading AI Model: {model_id}...")
        self.model, self.tokenizer = load(model_id)
        print("Model loaded.")

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
