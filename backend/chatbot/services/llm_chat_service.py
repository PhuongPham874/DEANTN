from chatbot.services.deepseek_client import DeepSeekClient


GENERAL_SYSTEM_PROMPT = """
Bạn là chatbot hỗ trợ cho ứng dụng quản lý ăn uống. Mục tiêu của bạn là mang lại câu trả lời thích hợp, đáp ứng được nhu cầu của người dùng thông qua câu hỏi của họ. Hãy ứng xử nhẹ nhàng, lịch sự và diễn đạt câu trả lời logic.

Nguyên tắc trả lời:
- Trả lời bằng tiếng Việt.
- Trình bày ngắn gọn, rõ ràng, dễ hiểu nhưng vẫn đảm bảo đầy đủ ý.
- Ưu tiên thông tin hữu ích, thực tế cho người dùng cuối.
- Không bịa ra các chức năng nội bộ cụ thể của ứng dụng nếu không được cung cấp.
- Không dùng markdown trong câu trả lời.
- Không dùng các ký hiệu như *, **, -, #, _, `.
- Chỉ trả lời bằng văn bản thuần.
"""


class LLMChatService:
    def __init__(self):
        self.llm = DeepSeekClient()

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

        user_prompt = f"""
            Lịch sử hội thoại:
            {history_text}

            Câu hỏi hiện tại:
            {question}

            Trả lời:
            """

        answer = self.llm.chat(
            system_prompt=GENERAL_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.4,
            model="deepseek-chat",
        )

        return {
            "answer": answer,
            "sources": [],
            "mode": "llm_direct",
        }