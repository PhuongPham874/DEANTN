from pathlib import Path

from chatbot.rag.loaders import load_docx
from chatbot.rag.splitter import split_documents
from chatbot.rag.embedding import get_embedding_model
from chatbot.rag.vector_store import build_faiss_index, save_faiss_index

BASE_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_FILE = BASE_DIR / "knowledge_base" / "knowledge_logic.docx"
FAISS_INDEX_DIR = BASE_DIR / "knowledge_base" / "faiss_index"


def build_index():
    if not KNOWLEDGE_FILE.exists():
        raise FileNotFoundError(f"Không tìm thấy file knowledge base: {KNOWLEDGE_FILE}")

    documents = load_docx(str(KNOWLEDGE_FILE))
    split_docs = split_documents(documents)
    embedding_model = get_embedding_model()

    vector_store = build_faiss_index(split_docs, embedding_model)
    save_faiss_index(vector_store, str(FAISS_INDEX_DIR))

    return {
        "message": "Build FAISS index thành công",
        "knowledge_file": str(KNOWLEDGE_FILE),
        "total_documents": len(documents),
        "total_chunks": len(split_docs),
        "index_dir": str(FAISS_INDEX_DIR),
    }