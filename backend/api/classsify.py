from fastapi import FastAPI,APIRouter
from schemas.classify_schema import ClassificationOutput,QuestionInput
from template_prompt.classifier import route_and_answer


app = APIRouter(prefix="/classify", tags=["classify"])

@app.post("/", response_model=ClassificationOutput)
def classify_question(payload: QuestionInput):
    answer = route_and_answer(payload)
    print("✅ Final Answer:\n", answer)
