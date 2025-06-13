from langchain.prompts import PromptTemplate
from langchain.llms import Ollama
from langchain.chains import LLMChain

class RAGChain:
    def __init__(self, model_name: str = 'mistral'):
        self.llm = Ollama(model=model_name)
        
        # ✅ Professionally engineered prompt for clarity and structure
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template=(
                "You are an expert assistant helping a user by summarizing information from documents.\n\n"
                "Use the following context to answer the user's question accurately and professionally.\n"
                "Always provide structured, concise, and fact-based answers. Do not hallucinate facts not present in the context.\n"
                "If the answer is not found in the context, respond with 'The answer is not available in the provided context.'\n\n"
                "Context:\n{context}\n\n"
                "Question:\n{question}\n\n"
                "Answer:"
            )
        )

        self.chain = LLMChain(llm=self.llm, prompt=self.prompt_template)

    def run(self, context: str, question: str) -> str:
        return self.chain.run(context=context, question=question)
