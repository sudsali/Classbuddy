from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyGroupViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register('', StudyGroupViewSet, basename='study-group')
router.register('messages', ChatMessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
] 