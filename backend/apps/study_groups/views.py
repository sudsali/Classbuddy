from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from .models import StudyGroup, ChatMessage, FileAttachment
from .serializers import StudyGroupSerializer, ChatMessageSerializer, FileAttachmentSerializer
import os
import mimetypes
import urllib.parse

# Create your views here.

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """Return messages for a specific study group."""
        print(f"Getting queryset with query params: {self.request.query_params}")
        
        # For detail actions (like upload_file), we need to return all messages
        # so that get_object can find the specific message by ID
        if self.action in ['upload_file', 'delete_file']:
            print("Returning all messages for detail action")
            return ChatMessage.objects.all()
            
        # For list actions, filter by group_id
        group_id = self.request.query_params.get('group_id')
        if group_id:
            print(f"Filtering messages by group_id: {group_id}")
            group = StudyGroup.objects.get(id=group_id)
            if self.request.user in group.members.all():
                return ChatMessage.objects.filter(study_group_id=group_id)
        
        print("No group_id provided, returning empty queryset")
        return ChatMessage.objects.none()

    def get_object(self):
        """Override get_object to add debugging."""
        print(f"Getting object with pk: {self.kwargs.get('pk')}")
        obj = super().get_object()
        print(f"Found object: {obj.id}, {obj.content}")
        return obj

    def perform_create(self, serializer):
        """Add the sender and validate group membership."""
        group_id = serializer.validated_data['study_group'].id
        group = StudyGroup.objects.get(id=group_id)
        
        if self.request.user not in group.members.all():
            raise PermissionError("You must be a member of the group to send messages.")
            
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        """Upload a file attachment to a message."""
        try:
            print(f"Uploading file to message with ID: {pk}")
            message = self.get_object()
            print(f"Found message: {message.id}, {message.content}")
            
            if 'file' not in request.FILES:
                return Response(
                    {"detail": "No file was uploaded."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            uploaded_file = request.FILES['file']
            print(f"File received: {uploaded_file.name}, size: {uploaded_file.size}")
            
            file_attachment = FileAttachment.objects.create(
                file=uploaded_file,
                original_filename=uploaded_file.name,
                file_size=uploaded_file.size,
                uploaded_by=request.user
            )
            
            print(f"File attachment created: {file_attachment.id}")
            message.attachments.add(file_attachment)
            print(f"File attachment added to message")
            
            serializer = FileAttachmentSerializer(file_attachment, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error uploading file: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'])
    def delete_file(self, request, pk=None):
        """Delete a file attachment from a message."""
        try:
            message = self.get_object()
            file_id = request.query_params.get('file_id')
            
            if not file_id:
                return Response(
                    {"detail": "File ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_attachment = get_object_or_404(FileAttachment, id=file_id)
            
            # Check if user has permission to delete the file
            if file_attachment.uploaded_by != request.user and message.sender != request.user:
                return Response(
                    {"detail": "You don't have permission to delete this file."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the file from storage
            if file_attachment.file:
                if os.path.isfile(file_attachment.file.path):
                    os.remove(file_attachment.file.path)
            
            file_attachment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def download_file(self, request):
        """Download a file attachment."""
        try:
            file_id = request.query_params.get('file_id')
            print(f"Downloading file with ID: {file_id}")
            
            if not file_id:
                return Response(
                    {"detail": "File ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_attachment = get_object_or_404(FileAttachment, id=file_id)
            print(f"Found file attachment: {file_attachment.id}, {file_attachment.original_filename}")
            
            # Check if user has permission to download the file
            message = ChatMessage.objects.filter(attachments=file_attachment).first()
            if not message or request.user not in message.study_group.members.all():
                return Response(
                    {"detail": "You don't have permission to download this file."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            print(f"User has permission to download file")
            
            # Create the response with the file
            response = FileResponse(file_attachment.file, as_attachment=True)
            
            # Set the Content-Disposition header with the original filename
            # Make sure to properly encode the filename for HTTP headers
            encoded_filename = urllib.parse.quote(file_attachment.original_filename)
            content_disposition = f'attachment; filename="{encoded_filename}"'
            print(f"Setting Content-Disposition header: {content_disposition}")
            response['Content-Disposition'] = content_disposition
            
            # Set the Content-Type header based on the file extension
            content_type, _ = mimetypes.guess_type(file_attachment.original_filename)
            if content_type:
                print(f"Setting Content-Type header: {content_type}")
                response['Content-Type'] = content_type
            else:
                print("Could not determine Content-Type, using application/octet-stream")
                response['Content-Type'] = 'application/octet-stream'
            
            # Set Access-Control-Expose-Headers to ensure the frontend can access these headers
            response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Type'
            
            return response
            
        except Exception as e:
            print(f"Error downloading file: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def search_messages(self, request, group_id=None):
        """Search messages in a specific group."""
        try:
            group = StudyGroup.objects.get(id=group_id)
            if request.user not in group.members.all():
                return Response(
                    {"detail": "You must be a member of the group to search messages."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            query = request.query_params.get('q', '')
            if not query:
                return Response(
                    {"detail": "Search query is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Searching messages in group {group_id} for query: {query}")
            messages = ChatMessage.objects.filter(
                study_group=group,
                content__icontains=query
            ).order_by('-timestamp')
            print(f"Found {messages.count()} messages")
            
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)
            
        except StudyGroup.DoesNotExist:
            return Response(
                {"detail": f"Study group with id {group_id} not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in search_messages: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.all()
    serializer_class = StudyGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudyGroup.objects.all().prefetch_related('members')
    
    def update(self, request, *args, **kwargs):
        group = self.get_object()
        if group.creator != request.user:
            return Response(
                {'detail': 'Only the group creator can update group properties.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow updating specific fields
        allowed_fields = {'name', 'description', 'subject', 'max_members'}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(group, data=update_data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a study group."""
        group = self.get_object()
        if request.user not in group.members.all():
            return Response(
                {"detail": "You must be a member of the group to view members."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        members = group.members.all()
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)

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

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get chat messages for a specific group."""
        group = self.get_object()
        if request.user not in group.members.all():
            return Response(
                {"detail": "You must be a member of the group to view messages."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = ChatMessage.objects.filter(study_group=group)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def create_message(self, request, pk=None):
        """Create a new message in the group."""
        try:
            group = self.get_object()
            
            if request.user not in group.members.all():
                return Response(
                    {"detail": "You must be a member of the group to send messages."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            content = request.data.get('content')
            if not content:
                return Response(
                    {"detail": "Message content is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            message = ChatMessage.objects.create(
                study_group=group,
                sender=request.user,
                content=content
            )
            
            serializer = ChatMessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
