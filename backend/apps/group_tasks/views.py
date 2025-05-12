from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        """Return tasks for a specific study group."""
        group_id = self.request.query_params.get('group_id')
        if group_id:
            return self.queryset.filter(group_id=group_id)
        return self.queryset

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        new_position = request.data.get('position', 0)
        if new_status:
            task.status = new_status
        task.position = new_position
        task.save()
        return Response(TaskSerializer(task).data)