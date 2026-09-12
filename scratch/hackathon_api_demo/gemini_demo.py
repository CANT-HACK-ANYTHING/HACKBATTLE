import os
import json
import urllib.request
import urllib.error

def ask_gemini(prompt: str, api_key: str) -> str:
    """
    Sends a prompt to Google's Gemini API and returns the generated text.
    Uses Python's built-in urllib so no external packages are needed!
    """
    # 1. THE ENDPOINT: The exact URL of the Gemini model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    # 2. THE HEADERS: Telling the server we are sending JSON data
    headers = {
        "Content-Type": "application/json"
    }

    # 3. THE REQUEST BODY: The structured payload the API expects
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    # Encode the payload dict to bytes (JSON string -> utf-8 bytes)
    json_data = json.dumps(payload).encode("utf-8")

    # Create the HTTP POST request
    req = urllib.request.Request(url, data=json_data, headers=headers, method="POST")

    try:
        # 4. SEND THE REQUEST:
        with urllib.request.urlopen(req) as response:
            response_body = response.read().decode("utf-8")
            
            # 5. PARSE THE JSON RESPONSE:
            result = json.loads(response_body)
            
            # Extract the generated text from Gemini's response schema
            # Structure: candidates[0] -> content -> parts[0] -> text
            answer = result["candidates"][0]["content"]["parts"][0]["text"]
            return answer

    except urllib.error.HTTPError as e:
        error_details = e.read().decode("utf-8")
        return f"HTTP Error {e.code}: {error_details}"
    except Exception as e:
        return f"An error occurred: {str(e)}"


if __name__ == "__main__":
    print("==========================================")
    print("       🤖 Hackathon LLM API Starter       ")
    print("==========================================\n")

    # Get API key from environment variable, or ask the user
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        api_key = input("Paste your Gemini API Key here (or set GEMINI_API_KEY env var): ").strip()

    if not api_key:
        print("\n❌ Error: An API key is required to make a request.")
        exit(1)

    # Prompt the user for a question
    question = input("\nAsk Gemini a question: ").strip()
    if not question:
        question = "What are the top 3 tips for winning a hackathon? Be concise."

    print(f"\n⏳ Sending request to Gemini...")
    answer = ask_gemini(question, api_key)

    print("\n--- 💡 Gemini's Response ---")
    print(answer)
    print("----------------------------\n")
