from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyGroupViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'', StudyGroupViewSet, basename='study-group')
message_router = DefaultRouter()
message_router.register(r'messages', ChatMessageViewSet, basename='chat-message')

# Add search messages endpoint directly
urlpatterns = [
    path('', include(router.urls)),
    path('', include(message_router.urls)),
    path('<int:group_id>/search_messages/', ChatMessageViewSet.as_view({'get': 'search_messages'}), name='search-messages'),
] 