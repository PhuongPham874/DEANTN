from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings


def get_embedding_model():
    if not settings.GEMINI_API_KEY:
        raise ValueError("Thiếu GEMINI_API_KEY trong file .env")

    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=settings.GEMINI_API_KEY,
    )