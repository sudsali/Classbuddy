from django.contrib import admin

# Register your models here.
from .models import File

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('name', 'file_type', 'uploaded_by', 'study_group', 'created_at') 
    search_fields = ('name', 'file_type', 'uploaded_by__username')  
    list_filter = ('file_type', 'created_at') 
    filter_horizontal = ('shared_with',)  