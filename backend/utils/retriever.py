from langchain_community.vectorstores.qdrant import Qdrant
from langchain.retrievers import AutoMergingRetriever
from config import qdrant_client, embedding_model, settings

def get_auto_merging_retriever():
    # Load existing vector store (no need to embed again)
    vectorstore = Qdrant(
        client=qdrant_client,
        collection_name=settings.QDRANT_COLLECTION,
        embedding=embedding_model  # still required here, but be sure not to serialize it
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
    
    # AutoMergingRetriever should be stateless and not hold the embedding model internally
    return AutoMergingRetriever(retriever=retriever)
