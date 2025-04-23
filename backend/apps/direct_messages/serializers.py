from rest_framework import serializers
from .models import Conversation, DirectMessage, TypingStatus
from apps.study_groups.serializers import FileAttachmentSerializer
from apps.users.serializers import UserSerializer

class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    reply_to = serializers.SerializerMethodField()
    attachments = FileAttachmentSerializer(many=True, read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'conversation', 'sender', 'content', 'timestamp', 'is_read', 'reply_to', 'attachments']
        read_only_fields = ['id', 'timestamp']

    def get_reply_to(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender': UserSerializer(obj.reply_to.sender).data,
                'content': obj.reply_to.content,
                'timestamp': obj.reply_to.timestamp
            }
        return None

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return DirectMessageSerializer(last_message).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class TypingStatusSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TypingStatus
        fields = ['id', 'conversation', 'user', 'is_typing', 'last_activity']
        read_only_fields = ['id', 'last_activity'] 