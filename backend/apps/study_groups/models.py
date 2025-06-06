from django.db import models
from django.utils.timezone import now
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()

class FileAttachment(models.Model):
    file = models.FileField(upload_to='chat_files/')
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField()  # Size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    
    def __str__(self):
        return self.original_filename

class ChatMessage(models.Model):
    study_group = models.ForeignKey('StudyGroup', on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    attachments = models.ManyToManyField(FileAttachment, blank=True, related_name='messages')
    
    class Meta:
        ordering = ['timestamp']
        
    def __str__(self):
        return f"{self.sender.get_full_name()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class StudyGroup(models.Model):
    name = models.CharField(
        max_length=100,
        validators=[
            MinLengthValidator(3),
            MaxLengthValidator(50)
        ],
        help_text="3-50 character group name"
    )
    description = models.TextField(
        help_text="Detailed description of group purpose"
    )
    subject = models.CharField(max_length=100)
    max_members = models.IntegerField(
        default=5,
        validators=[
            MinValueValidator(2, message="Maximum members must be at least 2"),
            MaxValueValidator(10, message="Maximum members cannot exceed 10")
        ],
        help_text="Number of maximum members (2-10)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(User, related_name='joined_groups')
    unique_identifier = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Auto-generated unique group ID"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Soft deletion timestamp"
    )

    def save(self, *args, **kwargs):
        """Generates unique ID using name + owner + timestamp."""
        if not self.unique_identifier:
            timestamp = now().strftime('%Y%m%d%H%M%S')
            self.unique_identifier = f"{self.name}-{self.creator.username}-{timestamp}"
        super().save(*args, **kwargs)

    def add_member(self, user):
        """Adds a user to the study group."""
        self.members.add(user)
        return True

    def remove_member(self, user):
        """Removes a user from the study group"""
        self.members.remove(user)
        return True

    def get_members(self):
        """Returns all members of the study group."""
        return self.members.all()

    def schedule_meeting(self, meeting_details):
        """Schedules a meeting for the study group"""
        from apps.meetings.models import Meeting  
        return Meeting.objects.create(study_group=self, **meeting_details)

    def delete_group(self):
        """Marks the group as deleted (soft delete)."""
        self.deleted_at = now()
        self.save()
        return True

    def update_group_info(self, details):
        """Updates group details based on the provided dictionary"""
        for key, value in details.items():
            setattr(self, key, value)
        self.save()
        return True

    def share_file(self, file):
        """Share a file with the group."""
        self.shared_files.add(file)
        return True

    class Meta:
        verbose_name = "Study Group"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.members.count()