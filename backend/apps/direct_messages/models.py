from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DirectMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_direct_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_direct_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
        
    def __str__(self):
        return f"{self.sender.get_full_name()} to {self.receiver.get_full_name()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class DirectChat(models.Model):
    participants = models.ManyToManyField(User, related_name='direct_chats')
    last_message = models.ForeignKey(DirectMessage, on_delete=models.SET_NULL, null=True, blank=True, related_name='chat')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"Chat between {', '.join([p.get_full_name() for p in self.participants.all()])}" 