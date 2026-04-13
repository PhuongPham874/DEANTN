import json

from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import ChatGoogleGenerativeAIError


USER_CONTEXT_SYSTEM_PROMPT = """
Bạn là chatbot hỗ trợ cá nhân cho ứng dụng quản lý ăn uống.

Vai trò của bạn:
- Trả lời dựa trên dữ liệu cá nhân của người dùng được cung cấp.
- Không bịa thêm dữ liệu không có trong context.
- Nếu dữ liệu chưa đủ, phải nói rõ là chưa đủ dữ liệu.

Nguyên tắc trả lời:
- Trả lời bằng tiếng Việt.
- Chỉ trả lời bằng văn bản thuần.
- Không dùng markdown.
- Không dùng các ký hiệu như *, **, -, #, _, `.
- Trình bày ngắn gọn, rõ ràng, dễ hiểu.
- Nếu người dùng hỏi hôm nay ăn gì, hãy ưu tiên dữ liệu thực đơn hôm nay.
- Nếu thực đơn hôm nay chưa đủ, có thể gợi ý thêm từ kho thực phẩm, món yêu thích và danh sách mua sắm.
- Nếu hỏi về kho, chỉ mô tả theo dữ liệu inventory.
- Nếu hỏi về món yêu thích, chỉ dùng dữ liệu favorite_dishes.
- Nếu hỏi về danh sách mua sắm, nêu rõ mục đã mua và chưa mua nếu có.
- Nếu hỏi nên ăn gì hoặc nấu gì, hãy suy luận từ dữ liệu hiện có nhưng không được khẳng định quá mức nếu dữ liệu chưa đủ.
"""


class UserContextChatService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("Thiếu GEMINI_API_KEY trong file .env")

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
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

    def ask(self, question: str, user_context: dict, chat_history: list | None = None):
        history_text = self._format_chat_history(chat_history)
        user_context_text = json.dumps(
            user_context,
            ensure_ascii=False,
            default=str,
            indent=2,
        )

        prompt = f"""
{USER_CONTEXT_SYSTEM_PROMPT}

Lịch sử hội thoại:
{history_text}

Dữ liệu người dùng:
{user_context_text}

Câu hỏi hiện tại:
{question}

Trả lời:
"""

        try:
            response = self.llm.invoke(prompt)
            return {
                "answer": response.content,
                "sources": [],
                "mode": "user_context_llm",
                "context_used": list(user_context.keys()),
            }
        except ChatGoogleGenerativeAIError as e:
            return {
                "answer": "Không thể truy vấn AI cho dữ liệu cá nhân lúc này. Vui lòng kiểm tra lại Gemini API.",
                "sources": [],
                "mode": "user_context_llm",
                "context_used": list(user_context.keys()),
                "error": str(e),
            }
        except Exception as e:
            return {
                
                "answer": f"Lỗi khi xử lý dữ liệu: {str(e)}",
                "sources": [],
                "mode": "user_context_llm",
                "context_used": list(user_context.keys()),
                "error": str(e),
            }