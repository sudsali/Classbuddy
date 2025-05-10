from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import StudyGroup, ChatMessage
from .serializers import StudyGroupSerializer, ChatMessageSerializer, UserSerializer

# Create your views here.

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return messages for a specific study group."""
        group_id = self.request.query_params.get('group_id')
        if group_id:
            group = StudyGroup.objects.get(id=group_id)
            if self.request.user in group.members.all():
                return ChatMessage.objects.filter(study_group_id=group_id)
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        """Add the sender and validate group membership."""
        group_id = serializer.validated_data['study_group'].id
        group = StudyGroup.objects.get(id=group_id)
        
        if self.request.user not in group.members.all():
            raise PermissionError("You must be a member of the group to send messages.")
            
        serializer.save(sender=self.request.user)

class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.all()
    serializer_class = StudyGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudyGroup.objects.all().prefetch_related('members')

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a study group."""
        group = self.get_object()
        if request.user not in group.members.all():
            return Response(
                {"detail": "You must be a member of the group to view members."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        members = group.members.all()
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if group.members.filter(id=user.id).exists():
            return Response(
                {'detail': 'You are already a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if group.members.count() >= group.max_members:
            return Response(
                {'detail': 'This group has reached its maximum member limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group.members.add(user)
        return Response({'detail': 'Successfully joined the group.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if not group.members.filter(id=user.id).exists():
            return Response(
                {'detail': 'You are not a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if group.creator == user and group.members.count() > 1:
            return Response(
                {'detail': 'As the creator, you cannot leave the group while other members are present.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If creator is leaving and they're the only member, delete the group
        if group.creator == user and group.members.count() == 1:
            group.delete()
            return Response({'detail': 'Group has been dismissed.'}, status=status.HTTP_200_OK)

        group.members.remove(user)
        return Response({'detail': 'Successfully left the group.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if group.creator != user:
            return Response(
                {'detail': 'Only the group creator can dismiss the group.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if group.members.count() > 1:
            return Response(
                {'detail': 'Cannot dismiss group while other members are present.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group.delete()
        return Response({'detail': 'Group has been dismissed.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get chat messages for a specific group."""
        group = self.get_object()
        if request.user not in group.members.all():
            return Response(
                {"detail": "You must be a member of the group to view messages."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = ChatMessage.objects.filter(study_group=group)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def create_message(self, request, pk=None):
        """Create a new message in the group."""
        try:
            group = self.get_object()
            
            if request.user not in group.members.all():
                return Response(
                    {"detail": "You must be a member of the group to send messages."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            content = request.data.get('content')
            if not content:
                return Response(
                    {"detail": "Message content is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            message = ChatMessage.objects.create(
                study_group=group,
                sender=request.user,
                content=content
            )
            
            serializer = ChatMessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
