from django.urls import path
from .views import login_view, register, send_otp_view, verify_otp_view, reset_password_view

urlpatterns = [
    path("login/", login_view),
    path("register/", register, name="register"),
    path("send-otp/", send_otp_view, name="password-reset-send-otp"),
    path("verify-otp/", verify_otp_view, name="password-reset-verify-otp"),
    path("reset-password/", reset_password_view, name="password-reset-reset"),
]
