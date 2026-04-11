import os
from google import genai
client = genai.Client(api_key="AIzaSyAsTs1EJtKB9J8JrvUa3V34LfJSbGdlc38")
try:
    response = client.models.generate_content(model="gemini-1.5-flash", contents="hello")
    print("gemini-1.5-flash:", response.text)
except Exception as e:
    print("1.5-flash error:", e)

try:
    response = client.models.generate_content(model="gemini-2.5-flash", contents="hello")
    print("gemini-2.5-flash:", response.text)
except Exception as e:
    print("2.5-flash error:", e)
