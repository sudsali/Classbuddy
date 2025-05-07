from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Task
from apps.study_groups.models import StudyGroup

User = get_user_model()

class TaskModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create test group
        self.group = StudyGroup.objects.create(
            name='Test Group',
            description='Test Description',
            subject='Test Subject',
            creator=self.user,
            max_members=5
        )
        
        # Create test tasks
        self.task1 = Task.objects.create(
            group=self.group,
            title='Test Task 1',
            description='Test Description 1',
            status='todo',
            position=0
        )
        self.task2 = Task.objects.create(
            group=self.group,
            title='Test Task 2',
            description='Test Description 2',
            status='in_progress',
            position=0
        )

    def test_task_creation(self):
        """Test task creation with basic fields"""
        self.assertEqual(self.task1.title, 'Test Task 1')
        self.assertEqual(self.task1.description, 'Test Description 1')
        self.assertEqual(self.task1.status, 'todo')
        self.assertEqual(self.task1.position, 0)
        self.assertEqual(self.task1.group, self.group)

    def test_task_status_choices(self):
        """Test task status choices"""
        valid_statuses = ['todo', 'in_progress', 'completed']
        for status in valid_statuses:
            self.task1.status = status
            self.task1.save()
            self.assertEqual(self.task1.status, status)

    def test_task_ordering(self):
        """Test task ordering by position"""
        tasks = Task.objects.all()
        self.assertEqual(tasks[0].position, 0)
        self.assertEqual(tasks[1].position, 0)
        
        # Test reordering
        self.task2.position = 0
        self.task2.save()
        self.task1.position = 1
        self.task1.save()
        
        tasks = Task.objects.all()
        self.assertEqual(tasks[0].position, 0)
        self.assertEqual(tasks[1].position, 1)

class TaskViewSetTest(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create test group
        self.group = StudyGroup.objects.create(
            name='Test Group',
            description='Test Description',
            subject='Test Subject',
            creator=self.user,
            max_members=5
        )
        
        # Add user to group
        self.group.members.add(self.user)
        
        # Create test tasks
        self.task1 = Task.objects.create(
            group=self.group,
            title='Test Task 1',
            description='Test Description 1',
            status='todo',
            position=0
        )
        self.task2 = Task.objects.create(
            group=self.group,
            title='Test Task 2',
            description='Test Description 2',
            status='in_progress',
            position=0
        )
        
        # Setup API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_tasks(self):
        """Test retrieving list of tasks"""
        response = self.client.get(f'/api/group_tasks/?group_id={self.group.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_task(self):
        """Test creating a new task"""
        data = {
            'group': self.group.id,
            'title': 'New Task',
            'description': 'New Description',
            'status': 'completed',
            'position': 1
        }
        response = self.client.post('/api/group_tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 3)

    def test_create_task_validation(self):
        """Test task creation validation"""
        # Test missing required fields
        data = {
            'group': self.group.id,
            'description': 'New Description'
        }
        response = self.client.post('/api/group_tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test invalid status
        data = {
            'group': self.group.id,
            'title': 'New Task',
            'description': 'New Description',
            'status': 'invalid_status'
        }
        response = self.client.post('/api/group_tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_task(self):
        """Test updating a task"""
        data = {
            'title': 'Updated Task',
            'description': 'Updated Description'
        }
        response = self.client.patch(f'/api/group_tasks/{self.task1.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.title, 'Updated Task')

    def test_delete_task(self):
        """Test deleting a task"""
        response = self.client.delete(f'/api/group_tasks/{self.task1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.count(), 1)

    def test_move_task(self):
        """Test moving a task to different status and position"""
        data = {
            'status': 'in_progress',
            'position': 1
        }
        response = self.client.post(f'/api/group_tasks/{self.task1.id}/move/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.status, 'in_progress')
        self.assertEqual(self.task1.position, 1)

    def test_unauthorized_access(self):
        """Test unauthorized access to tasks"""
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/group_tasks/?group_id={self.group.id}')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_task_filtering_by_status(self):
        """Test filtering tasks by status"""
        # Test filtering todo tasks
        response = self.client.get(f'/api/group_tasks/?group_id={self.group.id}&status=todo')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'todo')

        # Test filtering in_progress tasks
        response = self.client.get(f'/api/group_tasks/?group_id={self.group.id}&status=in_progress')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'in_progress')
