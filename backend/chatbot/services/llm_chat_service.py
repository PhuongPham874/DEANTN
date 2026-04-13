from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI


GENERAL_SYSTEM_PROMPT = """
Bạn là chatbot hỗ trợ cho ứng dụng quản lý ăn uống. Mục tiêu của bạn là mang lại câu trả lời thích hợp, đáp ứng được nhu cầu của người dùng thông qua câu hỏi của họ. Hãy ứng xử nhẹ nhàng, lịch sự và diễn đạt câu trả lời logic.

Nguyên tắc trả lời:
- Trả lời bằng tiếng Việt.
- Trình bày ngắn gọn, rõ ràng, dễ hiểu.
- Ưu tiên thông tin hữu ích, thực tế cho người dùng cuối.
- Không bịa ra các chức năng nội bộ cụ thể của ứng dụng nếu không được cung cấp.
- Nếu người dùng hỏi về kiến thức chung như dinh dưỡng, thực phẩm, sức khỏe ăn uống cơ bản, bạn có thể trả lời trực tiếp.
- Nếu người dùng hỏi về chức năng nội bộ của ứng dụng mà không có đủ thông tin, hãy nói rõ bạn chưa có dữ liệu chính xác.
- Không dùng markdown trong câu trả lời.
- Không dùng các ký hiệu như *, **, -, #, _, `.
- Chỉ trả lời bằng văn bản thuần.
"""


class LLMChatService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("Thiếu GEMINI_API_KEY trong file .env")

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.4,
            google_api_key=settings.GEMINI_API_KEY,
        )

    def _format_chat_history(self, chat_history: list | None) -> str:
        if not chat_history:
            return "Chưa có lịch sử hội thoại."

        lines = []
        for item in chat_history:
            role = item.get("role", "").strip().lower()
            content = item.get("content", "").strip()

            if not content:
                continue

            if role == "user":
                lines.append(f"Người dùng: {content}")
            elif role == "assistant":
                lines.append(f"Chatbot: {content}")
            else:
                lines.append(f"{role or 'Không rõ'}: {content}")

        return "\n".join(lines) if lines else "Chưa có lịch sử hội thoại."

    def ask(self, question: str, chat_history: list | None = None):
        history_text = self._format_chat_history(chat_history)

        prompt = f"""
{GENERAL_SYSTEM_PROMPT}

Lịch sử hội thoại:
{history_text}

Câu hỏi hiện tại:
{question}

Trả lời:
"""

        response = self.llm.invoke(prompt)

        return {
            "answer": response.content,
            "sources": [],
            "mode": "llm_direct",
        }