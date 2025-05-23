from django.contrib import admin

# Register your models here.
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'notification_type', 'created_at', 'is_read') 
    search_fields = ('user__username', 'message')  
    list_filter = ('notification_type', 'is_read')  