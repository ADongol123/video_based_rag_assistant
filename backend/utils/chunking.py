from transformers import AutoTokenizer
from langchain.schema import Document
import spacy

nlp = spacy.load("en_core_web_sm") 
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-mpnet-base-v2")

def refined_spacy_chunks(text: str, max_tokens: int = 512):
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]

    chunks = []
    current_chunk = ""
    current_tokens = 0

    for sentence in sentences:
        token_count = len(tokenizer.encode(sentence, add_special_tokens=False))

        if current_tokens + token_count <= max_tokens:
            current_chunk += " " + sentence
            current_tokens += token_count
        else:
            chunks.append(Document(page_content=current_chunk.strip()))
            current_chunk = sentence
            current_tokens = token_count

    if current_chunk:
        chunks.append(Document(page_content=current_chunk.strip()))

    return chunks
