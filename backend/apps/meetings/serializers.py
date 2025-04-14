from rest_framework import serializers
from .models import Meeting, MeetingDate, MemberAvailability

class MeetingDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingDate
        fields = ['id', 'date', 'earliest_time', 'latest_time']

class MemberAvailabilitySerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MemberAvailability
        fields = ['id', 'member', 'member_name', 'date', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['member', 'created_at', 'updated_at']

    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"

class MeetingSerializer(serializers.ModelSerializer):
    dates = MeetingDateSerializer(many=True, read_only=True)
    availabilities = MemberAvailabilitySerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'study_group', 'created_by', 'created_by_name',
            'created_at', 'status', 'dates', 'availabilities'
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"

    def create(self, validated_data):
        dates_data = self.context.get('dates_data', [])
        meeting = Meeting.objects.create(**validated_data)
        
        for date_data in dates_data:
            MeetingDate.objects.create(
                meeting=meeting,
                date=date_data['date'],
                earliest_time=date_data['timeRange'].split(' - ')[0],
                latest_time=date_data['timeRange'].split(' - ')[1]
            )
        
        return meeting 