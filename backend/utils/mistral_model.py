from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


class RAGChain:
    def __init__(self, model_name: str = 'mistral'):
        self.llm = Ollama(model=model_name)
        
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template=(
                "You are a helpful assistant. Use the following context to answer the user's question.\n\n"
                "Context:\n{context}\n\n"
                "Question:\n{question}\n\n"
                "Answer:"
            )
        )
        
        self.chain = LLMChain(llm = self.llm, prompt = self.prompt_template)
        
    
    def run(self, context: str, question: str) -> str:
        """
        Run the RAG chain with the provided context and question.
        
        :param context: The context to use for answering the question.
        :param question: The user's question.
        :return: The generated answer from the model.
        """
        return self.chain.run(context=context, question=question)