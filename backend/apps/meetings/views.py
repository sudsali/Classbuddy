from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from .models import Meeting, AvailabilitySlot
from .serializers import MeetingSerializer, AvailabilitySlotSerializer
from apps.study_groups.models import StudyGroup
import logging
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

def send_notification(user, message):
    """Send a notification to a user."""
    # This is a placeholder for the actual notification logic
    logger.info(f"Sending notification to {user.email}: {message}")

class MeetingViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            logger.info(f"Fetching meetings for user: {self.request.user.email}")
            
            # First check if the user is in any study groups
            user_groups = StudyGroup.objects.filter(members=self.request.user)
            logger.info(f"User is in {user_groups.count()} study groups")
            
            # Get meetings where the user is a member of the study group
            meetings = Meeting.objects.filter(
                study_group__members=self.request.user
            ).select_related('study_group', 'creator').prefetch_related('availability_slots')
            
            logger.info(f"Found {meetings.count()} meetings")
            
            # Log the SQL query for debugging
            logger.info(f"SQL Query: {str(meetings.query)}")
            
            return meetings
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}", exc_info=True)
            return Meeting.objects.none()

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creating meeting with data: {request.data}")
            
            # Validate study group exists and user is a member
            study_group_id = request.data.get('study_group_id')
            if not study_group_id:
                logger.error("study_group_id is missing from request data")
                return Response(
                    {'error': 'study_group_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            study_group = get_object_or_404(StudyGroup, id=study_group_id)
            if request.user not in study_group.members.all():
                logger.error(f"User {request.user.email} is not a member of study group {study_group_id}")
                return Response(
                    {'error': 'You are not a member of this study group'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create the meeting
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Serializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            meeting = serializer.save(creator=request.user)
            
            # Send notification
            send_notification(request.user, f"Meeting '{meeting.title}' has been created")
            
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Successfully created meeting: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error in create: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['get', 'post'])
    def availability(self, request, pk=None):
        try:
            meeting = self.get_object()
            
            # GET request to fetch availability
            if request.method == 'GET':
                availability_slots = AvailabilitySlot.objects.filter(
                    meeting=meeting
                ).select_related('user')
                serializer = AvailabilitySlotSerializer(availability_slots, many=True)
                return Response(serializer.data)
                
            # POST request to add availability
            elif request.method == 'POST':
                # Verify user is a member of the study group
                if request.user not in meeting.study_group.members.all():
                    logger.error(f"User {request.user.email} is not a member of study group for meeting {meeting.id}")
                    return Response(
                        {'error': 'You must be a member of the study group to add availability'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Create the availability slot
                serializer = AvailabilitySlotSerializer(data=request.data)
                if serializer.is_valid():
                    serializer.save(user=request.user, meeting=meeting)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                else:
                    logger.error(f"Invalid availability data: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            logger.error(f"Error in availability action: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            meeting_id = self.kwargs.get('meeting_pk')
            return AvailabilitySlot.objects.filter(
                meeting_id=meeting_id,
                meeting__study_group__members=self.request.user
            ).select_related('user', 'meeting')
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}", exc_info=True)
            return AvailabilitySlot.objects.none()

    def perform_create(self, serializer):
        try:
            meeting_id = self.kwargs.get('meeting_pk')
            meeting = get_object_or_404(Meeting, id=meeting_id)
            
            # Check if user is a member of the study group
            if self.request.user not in meeting.study_group.members.all():
                raise PermissionError("You must be a member of the study group to add availability.")
                
            serializer.save(user=self.request.user, meeting=meeting)
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}", exc_info=True)
            raise

class MeetingAvailabilityView(APIView):
    def get(self, request, meeting_id):
        # Sample response, replace with actual logic
        return Response({"message": f"GET availability for meeting {meeting_id}"}, status=status.HTTP_200_OK)

    def post(self, request, meeting_id):
        # Sample response, replace with actual logic
        return Response({"message": f"POST availability for meeting {meeting_id}"}, status=status.HTTP_201_CREATED)

class StudyGroupMembersView(APIView):
    def get(self, request, group_id):
        # Sample response, replace with actual logic
        return Response({"message": f"GET members for study group {group_id}"}, status=status.HTTP_200_OK)
