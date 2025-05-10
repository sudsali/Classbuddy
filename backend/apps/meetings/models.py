from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.study_groups.models import StudyGroup

class Meeting(models.Model):
    title = models.CharField(max_length=200, null=True, blank=True, default='Untitled Meeting')
    description = models.TextField(blank=True)
    study_group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='meetings')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_meetings', null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or 'Untitled Meeting'

class AvailabilitySlot(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='availability_slots')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availability_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('meeting', 'user', 'start_time', 'end_time')

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.start_time} to {self.end_time}"

    def cancel_meeting(self):
        self.delete()

    def join_meeting(self, user_id):
        from apps.users.models import User  
        user = User.objects.get(id=user_id)
        self.attendees.add(user)
        return True

    def end_meeting(self):
        self.status = 'COMPLETED'
        self.save()

    def update_meeting_details(self, details):
        for key, value in details.items():
            setattr(self, key, value)
        self.save()

    def get_attendees(self):
        return self.attendees.all()
