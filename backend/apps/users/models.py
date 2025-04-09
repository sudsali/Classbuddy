from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import logout

def validate_edu_email(value):
    """Ensures only .edu emails are allowed."""
    if not value.lower().endswith('.edu'):
        raise ValidationError('Only .edu email addresses are allowed.')

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None  # Remove username field
    email = models.EmailField(
        unique=True,
        validators=[validate_edu_email],
        help_text="Valid .edu email address"
    )
    
    # Make email the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

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
        return f"{self.email} ({self.get_full_name()})"
