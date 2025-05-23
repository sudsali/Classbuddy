from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeetingViewSet, AvailabilitySlotViewSet

router = DefaultRouter()
router.register(r'', MeetingViewSet, basename='meeting')

# Create a separate router for availability slots
availability_router = DefaultRouter()
availability_router.register(r'', AvailabilitySlotViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:meeting_pk>/availability/', include(availability_router.urls)),
]
