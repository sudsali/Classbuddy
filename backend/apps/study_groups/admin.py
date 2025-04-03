from django.contrib import admin

# Register your models here.
from .models import StudyGroup

@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'unique_identifier', 'created_at', 'deleted_at')
    search_fields = ('name', 'owner__username') 
    list_filter = ('created_at', 'deleted_at')
    filter_horizontal = ('members',) 