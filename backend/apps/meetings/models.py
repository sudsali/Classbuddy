from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.study_groups.models import StudyGroup
from django.contrib.auth import get_user_model

User = get_user_model()

class Meeting(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    study_group = models.ForeignKey(
        'study_groups.StudyGroup',
        on_delete=models.CASCADE,
        related_name='meetings'
    )
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_meetings'
    )
    date = models.DateField()
    time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    attendees = models.ManyToManyField(User, related_name='meeting_attendees', blank=True)

    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('COMPLETED', 'Completed'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UPCOMING')

    def __str__(self):
        return f"{self.title} - {self.study_group.name} on {self.date}"

    def cancel_meeting(self):
        self.delete()

    def join_meeting(self, user_id):
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
