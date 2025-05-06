from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DirectMessage, DirectChat
from apps.study_groups.serializers import FileAttachmentSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    attachments = FileAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = DirectMessage
        fields = ['id', 'sender', 'receiver', 'content', 'timestamp', 'attachments', 'is_read']
        read_only_fields = ['sender', 'timestamp', 'is_read']

class DirectChatSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = DirectMessageSerializer(read_only=True)
    
    class Meta:
        model = DirectChat
        fields = ['id', 'participants', 'last_message', 'updated_at'] 