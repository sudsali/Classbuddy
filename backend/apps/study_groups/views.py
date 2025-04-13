from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import StudyGroup
from .serializers import StudyGroupSerializer

# Create your views here.

class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.all()
    serializer_class = StudyGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudyGroup.objects.all().prefetch_related('members')

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if group.members.filter(id=user.id).exists():
            return Response(
                {'detail': 'You are already a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if group.members.count() >= group.max_members:
            return Response(
                {'detail': 'This group has reached its maximum member limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group.members.add(user)
        return Response({'detail': 'Successfully joined the group.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if not group.members.filter(id=user.id).exists():
            return Response(
                {'detail': 'You are not a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if group.creator == user and group.members.count() > 1:
            return Response(
                {'detail': 'As the creator, you cannot leave the group while other members are present.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If creator is leaving and they're the only member, delete the group
        if group.creator == user and group.members.count() == 1:
            group.delete()
            return Response({'detail': 'Group has been dismissed.'}, status=status.HTTP_200_OK)

        group.members.remove(user)
        return Response({'detail': 'Successfully left the group.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if group.creator != user:
            return Response(
                {'detail': 'Only the group creator can dismiss the group.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if group.members.count() > 1:
            return Response(
                {'detail': 'Cannot dismiss group while other members are present.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group.delete()
        return Response({'detail': 'Group has been dismissed.'}, status=status.HTTP_200_OK)
