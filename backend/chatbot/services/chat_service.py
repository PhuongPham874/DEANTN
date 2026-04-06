from chatbot.services.rag_service import RAGService


class ChatService:
    def __init__(self):
        self.rag_service = RAGService()

    def answer_question(self, message: str, chat_history: list | None = None):
        return self.rag_service.ask(message, chat_history)