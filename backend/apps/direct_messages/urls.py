from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, DirectMessageViewSet, TypingStatusViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', DirectMessageViewSet, basename='direct-message')
router.register(r'typing-status', TypingStatusViewSet, basename='typing-status')

urlpatterns = [
    path('', include(router.urls)),
] 