from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'group', 'status', 'position', 'created_at')
    list_filter = ('status', 'group')
    search_fields = ('title', 'description')
