FOLLOW_UP_TEMPLATE = """
You are an expert AI assistant helping me write professional emails.
I sent an email to {recipient} about "{subject}" on {date}.
Here is the email thread content:
{thread_content}

Your goal: Write a polite, professional, and concise follow-up email.
Context: {context}
Draft:
"""

COLD_EMAIL_TEMPLATE = """
You are an expert AI assistant helping me write professional emails.
I want to send a cold email to {recipient}.
Topic: {topic}
My Background: {background}
Goal: {goal}

Draft a high-converting cold email that creates curiosity and value.
Draft:
"""

CLASSIFICATION_TEMPLATE = """
Analyze the following email and determine if it is related to a job application, internship, part-time work, career opportunity, or recruitment process.
Respond with ONLY "YES" or "NO".

Subject: {subject}
Snippet: {snippet}

Is it job/career related?
Decision:
"""

FILTER_TEMPLATE = """
You are an email filtering assistant. Given a list of email metadata and a natural language prompt, return a JSON list of email IDs that match the criteria.
Prompt: "{prompt}"

Emails:
{metadata_list}

Return ONLY a JSON list of IDs.
Example: ["msg1", "msg2"]
Result:
"""
