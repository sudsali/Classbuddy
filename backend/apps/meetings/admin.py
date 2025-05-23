from django.contrib import admin

# Register your models here.
from .models import Meeting, AvailabilitySlot
from .models import Meeting

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'study_group', 'creator', 'created_at', 'status')
    readonly_fields = ('creator', 'created_at')
    list_filter = ('status', 'study_group', 'created_at')

@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ('meeting', 'user', 'start_time', 'end_time')
    search_fields = ('meeting__title', 'user__email')
    list_filter = ('start_time', 'end_time')
    readonly_fields = ('created_at',) 
