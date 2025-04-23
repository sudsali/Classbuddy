from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

class StudyGroup(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    subject = models.CharField(max_length=100)
    max_members = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(User, related_name='joined_groups')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.members.count() 