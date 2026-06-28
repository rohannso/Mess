from django.test import TestCase
from django.urls import reverse


class AuthTests(TestCase):
    def test_register_and_login_work(self):
        register_response = self.client.post(
            reverse('register'),
            {
                'name': 'Rohan',
                'phone': '9876543210',
                'email': 'rohan@example.com',
                'password': 'secret123',
                'role': 'student',
            },
            content_type='application/json',
        )

        self.assertEqual(register_response.status_code, 201)
        self.assertIn('access', register_response.json())

        login_response = self.client.post(
            reverse('login'),
            {
                'email': 'rohan@example.com',
                'password': 'secret123',
            },
            content_type='application/json',
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.json())
