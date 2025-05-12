from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DirectMessageViewSet, DirectChatViewSet

router = DefaultRouter()
router.register(r'messages', DirectMessageViewSet, basename='direct-message')
router.register(r'chats', DirectChatViewSet, basename='direct-chat')

urlpatterns = [
    path('', include(router.urls)),
] 