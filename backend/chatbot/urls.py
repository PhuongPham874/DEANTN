from django.urls import path
from .views import ChatbotAskAPIView, BuildIndexAPIView, GeneralChatAPIView

urlpatterns = [
    path("ask/", ChatbotAskAPIView.as_view(), name="chatbot-ask"),
    path("build-index/", BuildIndexAPIView.as_view(), name="chatbot-build-index"),
    path("general-ask/", GeneralChatAPIView.as_view(), name="general-chat-ask"),
]