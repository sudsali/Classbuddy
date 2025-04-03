from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import logout

def validate_edu_email(value):
    """Ensures only .edu emails are allowed."""
    if not value.lower().endswith('.edu'):
        raise ValidationError('Only .edu email addresses are allowed.')

class User(models.Model):
    username = models.CharField(
        max_length=255, 
        unique=True,
        help_text="Unique identifier for login"
    )
    email = models.EmailField(
        unique=True,
        validators=[validate_edu_email],
        help_text="Valid .edu email address"
    )
    name = models.CharField(
        max_length=255,
        help_text="Display name for the user"
    )

    shared_files = models.ManyToManyField(
        'files.File',
        related_name='shared_by_users',
        help_text="Files this user has shared"
    )

    def create_group(self, name, description):
        """Creates a new study group."""
        from apps.study_groups.models import StudyGroup
        return StudyGroup.objects.create(name=name, description=description, owner=self)

    def join_group(self, group):
        """Joins an existing study group."""
        group.members.add(self)
        return True

    def leave_group(self, group):
        """Leaves a study group."""
        group.members.remove(self)
        return True

    def update_profile(self, details):
        """Updates user profile based on the provided dictionary."""
        for key, value in details.items():
            setattr(self, key, value)
        self.save()
        return True

    def search_groups(self, criteria):
        """Searches groups based on criteria."""
        from apps.study_groups.models import StudyGroup
        return StudyGroup.objects.filter(**criteria)
    
    def logout(self, request):
        """Logs out the user (UML: logout()::void)"""
        logout(request)

    class Meta:
        verbose_name = "User"

    def __str__(self):
        return f"{self.username} ({self.email})"
