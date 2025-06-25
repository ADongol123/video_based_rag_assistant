import requests

PROMPT_TEMPLATE = """
You are a query classifier. Given a user's question, classify it into one of the following categories:
- conceptual
- mathematical
- code 
- image
- example
- definition
- step_by_step
- chat

Respond with only the category name 

Question: "{question}"
Category: 
"""

OLLAMA_API_URL = "http://localhost:11434/api/generate"

# 🔁 Map categories to models
MODEL_ROUTER = {
    "chat": "llama2",
    "example": "mistral",
    "conceptual": "mistral",
    "mathematical": "mistral",
    "code": "codellama",
    "definition": "mistral",
    "step_by_step": "phi",
    "image": "llava" 
}

# Classify the question
def classify_question(question: str) -> str:
    prompt = PROMPT_TEMPLATE.format(question=question)

    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": "mistral", "prompt": prompt, "stream": False}
        )
        if response.status_code != 200:
            print("Classification error:", response.status_code, response.text)
            return "chat"

        result = response.json()
        category = result.get("response", "").split("Category:")[-1].strip().lower()
        return category

    except Exception as e:
        print("Error classifying:", e)
        return "chat"

# Run the actual model based on category
def route_and_answer(question: str) -> str:
    category = classify_question(question)
    print(f"🧠 Detected category: {category}")

    model = MODEL_ROUTER.get(category, "mistral")  # default fallback

    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": model,
                "prompt": question,
                "stream": False
            }
        )
        if response.status_code != 200:
            print("Model response error:", response.status_code, response.text)
            return "Sorry, couldn't generate a response."

        result = response.json()
        return result.get("response", "").strip()

    except Exception as e:
        print("Error running model:", e)
        return "Error generating answer."