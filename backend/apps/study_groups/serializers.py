from rest_framework import serializers
from .models import StudyGroup, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'study_group', 'sender', 'content', 'timestamp']
        read_only_fields = ['sender', 'timestamp']

class StudyGroupSerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(read_only=True)
    is_member = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    members = UserSerializer(many=True, read_only=True)
    creator_details = UserSerializer(source='creator', read_only=True)
    
    class Meta:
        model = StudyGroup
        fields = ['id', 'name', 'description', 'subject', 'max_members', 
                 'created_at', 'creator', 'creator_details', 'members', 
                 'members_count', 'is_member', 'is_creator']
        read_only_fields = ['creator', 'created_at', 'members_count']

    def validate_max_members(self, value):
        if value < 2:
            raise serializers.ValidationError("Maximum members must be at least 2")
        
        # When updating, check against current member count
        if self.instance:  # This means we're updating an existing group
            current_members = self.instance.members.count()
            if value < current_members:
                raise serializers.ValidationError(
                    f"Maximum members cannot be less than current member count ({current_members})"
                )
        return value

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Group name must be at least 3 characters long")
        return value.strip()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator_id == request.user.id
        return False

    def create(self, validated_data):
        user = self.context['request'].user
        group = StudyGroup.objects.create(creator=user, **validated_data)
        group.members.add(user)  # Add creator as a member
        return group 