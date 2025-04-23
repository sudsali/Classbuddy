from django.db import models
from django.core.validators import MaxValueValidator

class File(models.Model):
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)  # e.g., PDF, DOCX or any other 
    study_group = models.ForeignKey(
        'study_groups.StudyGroup',  
        on_delete=models.CASCADE, 
        related_name='files'
    )
    uploaded_by = models.ForeignKey(
        'users.User',  
        on_delete=models.CASCADE
    )
    file_path = models.FileField(
        upload_to='uploads/%Y/%m/%d/',
        validators=[MaxValueValidator(25*1024*1024, message=("File size must be ≤25MB"))]
    )   
    created_at = models.DateTimeField(auto_now_add=True)

    shared_with = models.ManyToManyField(
        'users.User',
        related_name='files_shared_with_me',
        help_text="Users this file is shared with"
    )

    @property
    def metadata(self):
        return {
            "uploader": self.uploaded_by.name,
            "upload_date": self.created_at,
            "file_type": self.file_type,
        }

    def share(self, user):
        self.shared_with.add(user)
        from apps.notifications.models import Notification 
        Notification.create_notification(
            user_id=user.id,
            message=f"New shared file: {self.name}",
            notification_type='FILE_UPLOAD'
        )
        return True

    def download(self):
        # Logic for downloading files securely
        from django.http import FileResponse
        return FileResponse(self.file_path.open(), as_attachment=True)

    def delete_file(self):
        self.delete()