from django.contrib import admin

# Register your models here.
from .models import Meeting, AvailabilitySlot

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'study_group', 'created_by', 'created_at')
    search_fields = ('title', 'study_group__name', 'created_by__email')
    list_filter = ('created_at', 'study_group')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ('meeting', 'user', 'start_time', 'end_time')
    search_fields = ('meeting__title', 'user__email')
    list_filter = ('start_time', 'end_time')
    readonly_fields = ('created_at',) 