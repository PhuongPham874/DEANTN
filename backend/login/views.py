from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    body = json.loads(request.body)
    username = body.get("username")
    password = body.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:
        return JsonResponse({
            "authenticated": True,
            "username": user.username,
            "user_id": user.id
        })
    else:
        return JsonResponse({
            "authenticated": False,
            "message": "Sai username hoặc password"
        }, status=401)