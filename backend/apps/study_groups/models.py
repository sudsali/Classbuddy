from django.db import models
from django.utils.timezone import now
from django.core.validators import MinLengthValidator, MaxLengthValidator

class StudyGroup(models.Model):
    name = models.CharField(
        max_length=255,
        validators=[
            MinLengthValidator(3),
            MaxLengthValidator(50)
        ],
        help_text="3-50 character group name"
    )
    description = models.TextField(
        help_text="Detailed description of group purpose"
    )
    owner = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE,
        related_name='owned_groups',
        help_text="Creator/admin of the group"
    )
    members = models.ManyToManyField(
        'users.User',  # String reference
        related_name='joined_groups',
        help_text="All participants in the group"
    )
    unique_identifier = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Auto-generated unique group ID"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Group creation timestamp"
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
            self.unique_identifier = f"{self.name}-{self.owner.username}-{timestamp}"
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

    def __str__(self):
       return f"{self.unique_identifier}"