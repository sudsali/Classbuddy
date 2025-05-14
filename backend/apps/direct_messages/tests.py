from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import DirectChat, DirectMessage
from datetime import datetime, timezone
import json

User = get_user_model()

class DirectMessagesTests(TestCase):
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            email='user1@nyu.edu',
            password='segroup2',
            first_name='User',
            last_name='One'
        )
        self.user2 = User.objects.create_user(
            email='user2@nyu.edu',
            password='segroup2',
            first_name='User',
            last_name='Two'
        )
        self.user3 = User.objects.create_user(
            email='user3@nyu.edu',
            password='segroup2',
            first_name='User',
            last_name='Three'
        )

        # Setup API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)

        # Create a test chat
        self.chat = DirectChat.objects.create()
        self.chat.participants.add(self.user1, self.user2)

        # Create some test messages
        self.message1 = DirectMessage.objects.create(
            chat=self.chat,
            sender=self.user1,
            receiver=self.user2,
            content='Hello User2!'
        )
        self.message2 = DirectMessage.objects.create(
            chat=self.chat,
            sender=self.user2,
            receiver=self.user1,
            content='Hi User1!'
        )

    def test_get_or_create_chat(self):
        """Test creating and retrieving chats"""
        url = reverse('direct-messages-get-or-create')
        
        # Test creating new chat
        response = self.client.post(url, {'email': 'user3@nyu.edu'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DirectChat.objects.filter(
            participants=self.user1
        ).filter(participants=self.user3).exists())

        # Test retrieving existing chat
        response = self.client.post(url, {'email': 'user2@nyu.edu'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.chat.id)

        # Test invalid email
        response = self.client.post(url, {'email': 'invalid@nyu.edu'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_chats(self):
        """Test listing user's chats"""
        url = reverse('direct-messages-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # User1 should only see one chat
        self.assertEqual(response.data[0]['id'], self.chat.id)

        # Test ordering by updated_at
        new_chat = DirectChat.objects.create()
        new_chat.participants.add(self.user1, self.user3)
        DirectMessage.objects.create(
            chat=new_chat,
            sender=self.user1,
            receiver=self.user3,
            content='New chat message'
        )

        response = self.client.get(url)
        self.assertEqual(response.data[0]['id'], new_chat.id)  # New chat should be first

    def test_send_message(self):
        """Test sending messages"""
        url = reverse('direct-messages-send', args=[self.chat.id])
        
        # Test valid message
        data = {
            'content': 'Test message',
            'receiver_id': self.user2.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DirectMessage.objects.count(), 3)

        # Test empty content
        data['content'] = ''
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test too long content
        data['content'] = 'x' * 1001
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test invalid receiver
        data['content'] = 'Test message'
        data['receiver_id'] = self.user3.id
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_messages(self):
        """Test retrieving chat messages"""
        url = reverse('direct-messages-retrieve', args=[self.chat.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['content'], 'Hello User2!')

        # Test empty chat
        new_chat = DirectChat.objects.create()
        new_chat.participants.add(self.user1, self.user3)
        url = reverse('direct-messages-retrieve', args=[new_chat.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_mark_as_read(self):
        """Test marking messages as read"""
        url = reverse('direct-messages-mark-read', args=[self.chat.id])
        
        # Mark messages as read
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        messages = DirectMessage.objects.filter(receiver=self.user1)
        self.assertTrue(all(msg.is_read for msg in messages))

        # Test non-participant access
        self.client.force_authenticate(user=self.user3)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_chat(self):
        """Test soft-deleting chats"""
        url = reverse('direct-messages-delete', args=[self.chat.id])
        
        # Delete chat for user1
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify chat is hidden for user1 but visible for user2
        self.client.force_authenticate(user=self.user1)
        list_url = reverse('direct-messages-list')
        response = self.client.get(list_url)
        self.assertEqual(len(response.data), 0)

        self.client.force_authenticate(user=self.user2)
        response = self.client.get(list_url)
        self.assertEqual(len(response.data), 1)