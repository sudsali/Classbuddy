from django.db import models

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('FILE_UPLOAD', 'New File Uploaded'),
        ('MEETING_REMINDER', 'Meeting Reminder'),
        ('GROUP_UPDATE', 'Group Updated'),
    ]

    user = models.ForeignKey(
        'users.User',  
        on_delete=models.CASCADE
    )
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    is_read = models.BooleanField(default=False)

    @staticmethod
    def create_notification(user_id, message, notification_type):
        from apps.users.models import User 
        user = User.objects.get(id=user_id)
        Notification.objects.create(user=user, message=message, notification_type=notification_type)

    def mark_as_read(self):
        self.is_read = True
        self.save()
