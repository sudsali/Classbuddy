from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import DirectMessage, DirectChat, DeletedChat
from .serializers import DirectMessageSerializer, DirectChatSerializer, UserSerializer

User = get_user_model()

class DirectMessageViewSet(viewsets.ModelViewSet):
    serializer_class = DirectMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return DirectMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('timestamp')
    
    def create(self, request, *args, **kwargs):
        receiver_id = request.data.get('receiver')
        content = request.data.get('content')
        
        if not receiver_id:
            return Response(
                {'error': 'Receiver ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Receiver not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Create the message
        message = DirectMessage.objects.create(
            sender=request.user,
            receiver=receiver,
            content=content
        )
        
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = DirectMessage.objects.filter(
            receiver=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        message_ids = request.data.get('message_ids', [])
        DirectMessage.objects.filter(
            id__in=message_ids,
            receiver=request.user
        ).update(is_read=True)
        return Response({'status': 'success'})

class DirectChatViewSet(viewsets.ModelViewSet):
    serializer_class = DirectChatSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Exclude chats that have been deleted by the current user
        return DirectChat.objects.filter(
            participants=user
        ).exclude(
            deleted_by_users__user=user
        ).order_by('-updated_at')
    
    @action(detail=False, methods=['post'])
    def get_or_create_chat(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            other_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if other_user == request.user:
            return Response(
                {'error': 'Cannot create chat with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if chat already exists and is not deleted
        existing_chat = DirectChat.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).exclude(
            deleted_by_users__user=request.user
        ).first()
        
        if existing_chat:
            serializer = self.get_serializer(existing_chat)
            return Response(serializer.data)
            
        # Check if there's a deleted chat that we can reuse
        deleted_chat = DirectChat.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).filter(
            deleted_by_users__user=request.user
        ).first()
        
        if deleted_chat:
            # Remove the deleted mark and reuse the chat
            DeletedChat.objects.filter(user=request.user, chat=deleted_chat).delete()
            serializer = self.get_serializer(deleted_chat)
            return Response(serializer.data)
            
        # Create new chat if no existing or deleted chat found
        chat = DirectChat.objects.create()
        chat.participants.add(request.user, other_user)
        
        # Only return the chat if it has messages
        if chat.last_message:
            serializer = self.get_serializer(chat)
            return Response(serializer.data)
        else:
            # Return just the chat ID and participants if no messages yet
            return Response({
                'id': chat.id,
                'participants': [
                    {
                        'id': p.id,
                        'first_name': p.first_name,
                        'last_name': p.last_name,
                        'email': p.email
                    } for p in chat.participants.all()
                ]
            })
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        # First check if the chat exists and hasn't been deleted for this user
        try:
            chat = DirectChat.objects.filter(
                id=pk,
                participants=request.user
            ).exclude(
                deleted_by_users__user=request.user
            ).get()
        except DirectChat.DoesNotExist:
            return Response(
                {'error': 'Chat not found or has been deleted'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        messages = DirectMessage.objects.filter(
            Q(sender=request.user, receiver__in=chat.participants.all()) |
            Q(receiver=request.user, sender__in=chat.participants.all())
        ).order_by('timestamp')
        
        serializer = DirectMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        chat = self.get_object()
        
        # Check if user is a participant
        if request.user not in chat.participants.all():
            return Response(
                {'error': 'You are not a participant in this chat'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Instead of deleting the chat and messages, mark it as deleted for this user
        DeletedChat.objects.create(user=request.user, chat=chat)
        
        return Response(status=status.HTTP_204_NO_CONTENT) 