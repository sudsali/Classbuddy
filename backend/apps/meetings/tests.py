from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from datetime import datetime, timedelta
from unittest.mock import patch
from apps.meetings.models import Meeting
from apps.users.models import User
from apps.study_groups.models import StudyGroup
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class MeetingModelTest(TestCase):
    def setUp(self):
        # Arrange
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.group = StudyGroup.objects.create(
            name='Test Group',
            description='Test Description',
            subject='Test Subject',
            creator=self.user,
            max_members=5
        )
        self.group.members.add(self.user)  # Add user to study group
        self.meeting = Meeting.objects.create(
            title='Test Meeting',
            study_group=self.group,
            creator=self.user,
            date=timezone.now().date(),
            time=timezone.now().time()
        )

    def test_meeting_creation(self):
        # Act & Assert
        self.assertEqual(self.meeting.title, 'Test Meeting')
        self.assertEqual(self.meeting.study_group, self.group)
        self.assertEqual(self.meeting.creator, self.user)

    def test_meeting_str_representation(self):
        expected_str = f"{self.meeting.title} - {self.meeting.study_group.name} on {self.meeting.date}"
        self.assertEqual(str(self.meeting), expected_str)

class MeetingViewTest(APITestCase):
    def setUp(self):
        # Arrange
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.group = StudyGroup.objects.create(
            name='Test Group',
            description='Test Description',
            creator=self.user
        )
        self.group.members.add(self.user)  # Add user to study group
        self.token = Token.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.meeting_data = {
            'title': 'Test Meeting',
            'study_group_id': self.group.id,
            'date': timezone.now().date().isoformat(),
            'time': timezone.now().time().isoformat()
        }

    def test_create_meeting(self):
        response = self.client.post(
            reverse('meeting-list'),
            self.meeting_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Meeting.objects.count(), 1)
        self.assertEqual(Meeting.objects.get().title, 'Test Meeting')

    def test_create_meeting_invalid_data(self):
        self.meeting_data['title'] = ''
        response = self.client.post(
            reverse('meeting-list'),
            self.meeting_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

    def test_get_meetings_list(self):
        # Arrange
        Meeting.objects.create(
            title='Test Meeting',
            study_group=self.group,
            creator=self.user,
            date=timezone.now().date(),
            time=timezone.now().time()
        )

        # Act
        response = self.client.get(reverse('meeting-list'))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch('apps.meetings.views.send_notification')
    def test_meeting_notification(self, mock_send_notification):
        # Arrange
        meeting_data = {
            'title': 'Meeting with Notification',
            'study_group_id': self.group.id,
            'date': timezone.now().date(),
            'time': timezone.now().time()
        }

        # Act
        response = self.client.post(reverse('meeting-list'), meeting_data)

        # Assert
        self.assertEqual(response.status_code, 201)
        mock_send_notification.assert_called_once()

class MeetingAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)

        self.group = StudyGroup.objects.create(
            name='Test Group',
            description='Test Description',
            creator=self.user
        )
        self.group.members.add(self.user)  # Add user to study group
        self.meeting_data = {
            'title': 'Test Meeting',
            'study_group_id': self.group.id,
            'date': timezone.now().date().isoformat(),
            'time': timezone.now().time().isoformat()
        }

    def test_create_meeting_success(self):
        response = self.client.post(
            reverse('meeting-list'),
            self.meeting_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Meeting.objects.count(), 1)
        self.assertEqual(Meeting.objects.get().title, 'Test Meeting')

    def test_create_meeting_missing_required_fields(self):
        # Test missing title
        data = self.meeting_data.copy()
        del data['title']
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

        # Test missing date
        data = self.meeting_data.copy()
        del data['date']
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

        # Test missing time
        data = self.meeting_data.copy()
        del data['time']
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

    def test_create_meeting_invalid_date_format(self):
        data = self.meeting_data.copy()
        data['date'] = 'invalid-date'
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

    def test_create_meeting_invalid_time_format(self):
        data = self.meeting_data.copy()
        data['time'] = 'invalid-time'
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

    def test_create_meeting_empty_title(self):
        data = self.meeting_data.copy()
        data['title'] = ''
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)

    def test_create_meeting_title_length_validation(self):
        data = self.meeting_data.copy()
        data['title'] = 'a' * 256  # Exceeds max_length
        response = self.client.post(
            reverse('meeting-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Meeting.objects.count(), 0)
