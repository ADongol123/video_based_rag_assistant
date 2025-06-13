from langchain_community.vectorstores.qdrant import Qdrant
# from config import qdrant_client, embedding_model, settings
from utils.vector_store import get_qdrant_vectorstore
from langchain.embeddings import HuggingFaceEmbeddings

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

def embed_and_store(docs):
    print(get_qdrant_vectorstore())
    vectorstore = get_qdrant_vectorstore()
    vectorstore.add_documents(documents=docs)



def generate_embeddings_for_mongo(chunks):
    records = []
    for chunk in chunks:
        embedding = embedding_model.embed_query(chunk.page_content)
        records.append({
            "text": chunk.page_content,
            "embedding": embedding
        })
    return records