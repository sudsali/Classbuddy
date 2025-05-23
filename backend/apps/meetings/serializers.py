from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Meeting, AvailabilitySlot
from apps.study_groups.models import StudyGroup
from apps.study_groups.serializers import StudyGroupSerializer
from apps.users.serializers import UserSerializer
from django.utils import timezone

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match.")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = ['id', 'user', 'start_time', 'end_time', 'created_at']
        read_only_fields = ['user', 'created_at']

class MeetingSerializer(serializers.ModelSerializer):
    study_group = StudyGroupSerializer(read_only=True)
    study_group_id = serializers.PrimaryKeyRelatedField(
        queryset=StudyGroup.objects.all(),
        source='study_group',
        write_only=True,
        required=True,
        error_messages={
            'required': 'Please select a study group',
            'does_not_exist': 'The selected study group does not exist',
            'invalid': 'Invalid study group selection'
        }
    )
    date = serializers.DateField(required=True, error_messages={
        'required': 'Please select a date for the meeting',
        'invalid': 'Please enter a valid date'
    })
    time = serializers.TimeField(required=True, error_messages={
        'required': 'Please select a time for the meeting',
        'invalid': 'Please enter a valid time'
    })
    description = serializers.CharField(required=False, allow_blank=True)
    creator = UserSerializer(read_only=True)
    availability_slots = AvailabilitySlotSerializer(many=True, read_only=True)

    class Meta:
        model = Meeting
        fields = ['id', 'title', 'description', 'study_group', 'study_group_id', 
                 'creator', 'date', 'time', 'created_at', 'availability_slots']
        read_only_fields = ['creator', 'created_at']
        extra_kwargs = {
            'title': {
                'required': True,
                'error_messages': {
                    'required': 'Please provide a meeting title',
                    'blank': 'Meeting title cannot be empty'
                }
            }
        }

    def validate(self, data):
        # Validate that the user is a member of the study group
        study_group = data.get('study_group')
        user = self.context['request'].user
        if study_group and user not in study_group.members.all():
            raise serializers.ValidationError({
                'study_group_id': 'You are not a member of this study group'
            })

        # Validate that the date is not in the past
        date = data.get('date')
        if date and date < timezone.now().date():
            raise serializers.ValidationError({
                'date': 'Meeting date cannot be in the past'
            })

        return data

    def create(self, validated_data):
        # Set the creator field to the current user
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)