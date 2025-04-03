from django.contrib import admin

# Register your models here.
from .models import Meeting

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('study_group', 'date', 'time', 'status')  
    search_fields = ('study_group__name',)  
    list_filter = ('status', 'date') 
    filter_horizontal = ('attendees',) 