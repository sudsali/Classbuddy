from rest_framework import serializers
from .models import StudyGroup

class StudyGroupSerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(read_only=True)
    is_member = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    
    class Meta:
        model = StudyGroup
        fields = ['id', 'name', 'description', 'subject', 'max_members', 
                 'created_at', 'creator', 'members_count', 'is_member', 'is_creator']
        read_only_fields = ['creator', 'created_at']

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