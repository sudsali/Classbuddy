from django.contrib import admin

# Register your models here.
from .models import StudyGroup

@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'subject', 'members_count', 'created_at')
    search_fields = ('name', 'subject', 'description')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)
    filter_horizontal = ('members',) 