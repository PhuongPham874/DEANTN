from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from chatbot.serializers import ChatRequestSerializer
from chatbot.services.chat_service import ChatService
from chatbot.rag.index_builder import build_index
from chatbot.services.llm_chat_service import LLMChatService


class BuildIndexAPIView(APIView):
    def post(self, request):
        result = build_index()
        return Response(result, status=status.HTTP_200_OK)


class ChatbotAskAPIView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        chat_history = serializer.validated_data.get("chat_history", [])

        service = ChatService()
        result = service.answer_question(message, chat_history)

        return Response(result, status=status.HTTP_200_OK)
    
class BuildIndexAPIView(APIView):
    def post(self, request):
        result = build_index()
        return Response(result, status=status.HTTP_200_OK)


class ChatbotAskAPIView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        chat_history = serializer.validated_data.get("chat_history", [])

        service = ChatService()
        result = service.answer_question(message, chat_history)

        return Response(result, status=status.HTTP_200_OK)


class GeneralChatAPIView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        chat_history = serializer.validated_data.get("chat_history", [])

        service = LLMChatService()
        result = service.ask(message, chat_history)

        return Response(result, status=status.HTTP_200_OK)