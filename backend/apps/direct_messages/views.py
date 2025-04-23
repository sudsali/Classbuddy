from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, DirectMessage, TypingStatus
from .serializers import ConversationSerializer, DirectMessageSerializer, TypingStatusSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation.participants.add(user_id)
        return Response(self.get_serializer(conversation).data)

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation.participants.remove(user_id)
        return Response(self.get_serializer(conversation).data)

class DirectMessageViewSet(viewsets.ModelViewSet):
    serializer_class = DirectMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DirectMessage.objects.filter(
            Q(conversation__participants=self.request.user)
        ).order_by('-timestamp')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response(self.get_serializer(message).data)

class TypingStatusViewSet(viewsets.ModelViewSet):
    serializer_class = TypingStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TypingStatus.objects.filter(
            Q(conversation__participants=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def update_status(self, request):
        conversation_id = request.data.get('conversation_id')
        is_typing = request.data.get('is_typing', False)

        if not conversation_id:
            return Response({'error': 'Conversation ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        status_obj, created = TypingStatus.objects.get_or_create(
            conversation_id=conversation_id,
            user=request.user,
            defaults={'is_typing': is_typing}
        )

        if not created:
            status_obj.is_typing = is_typing
            status_obj.save()

        return Response(self.get_serializer(status_obj).data) 