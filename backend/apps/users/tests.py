from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
User = get_user_model()

class AuthTests(TestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.verify_url = reverse('verify_email')

    def test_register_non_edu_email(self):
        data = {
            "email": "student@gmail.com",
            "password": "StrongPass123",
            "password2": "StrongPass123",
            "first_name": "Test",
            "last_name": "User"
        }
        response = self.client.post(self.register_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Only .edu email addresses are allowed.', str(response.content))

    def test_login_verified_user(self):
        user = User.objects.create_user(
            email="verified@university.edu",
            password="StrongPass123",
            is_verified=True
        )
        response = self.client.post(self.login_url, {
            "email": "verified@university.edu",
            "password": "StrongPass123"
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

    def test_login_unverified_user(self):
        user = User.objects.create_user(
            email="unverified@university.edu",
            password="StrongPass123",
            is_verified=False
        )
        response = self.client.post(self.login_url, {
            "email": "unverified@university.edu",
            "password": "StrongPass123"
        }, content_type='application/json')
        self.assertEqual(response.status_code, 401)


    def test_verify_email_code(self):
        user = User.objects.create_user(
            email="verifyme@university.edu",
            password="StrongPass123",
            verification_code="123456",
            is_verified=False
        )
        response = self.client.post(self.verify_url, {
            "email": "verifyme@university.edu",
            "code": "123456"
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)
