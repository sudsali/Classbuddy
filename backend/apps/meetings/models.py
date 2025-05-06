from django.db import models

class Meeting(models.Model):
    study_group = models.ForeignKey(
        'study_groups.StudyGroup',  
        on_delete=models.CASCADE, 
        related_name='meetings'
    )
    date = models.DateField()
    time = models.TimeField()
    attendees = models.ManyToManyField('users.User')  
    
    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('COMPLETED', 'Completed'),
    ]
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UPCOMING')

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
