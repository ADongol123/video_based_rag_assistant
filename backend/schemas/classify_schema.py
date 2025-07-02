from pydantic import BaseModel

class QueryInput(BaseModel):
    question: str
    

class QuestionInput(BaseModel):
    question: str

class ClassificationOutput(BaseModel):
    category: str