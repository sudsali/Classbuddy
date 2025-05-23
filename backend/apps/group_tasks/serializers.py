from rest_framework import serializers
from .models import Task
from django.contrib.auth import get_user_model

User = get_user_model()

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        allow_null=True,
        queryset=User.objects.none()  # We'll set this dynamically
    )

    class Meta:
        model = Task
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Dynamically restrict assigned_to field
        group = None

        # Case 1: instance provided (for update or GET)
        if self.instance and hasattr(self.instance, 'group'):
            group = self.instance.group

        # Case 2: data is being passed (for create)
        elif hasattr(self, 'initial_data') and self.initial_data.get('group'):
            from apps.study_groups.models import StudyGroup
            try:
                group = StudyGroup.objects.get(id=self.initial_data['group'])
            except StudyGroup.DoesNotExist:
                pass

        if group:
            self.fields['assigned_to'].queryset = group.members.all()