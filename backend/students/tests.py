from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Student

User = get_user_model()


class StudentTests(TestCase):
    def test_student_profile_created_for_registered_student(self):
        user = User.objects.create_user(email='student@example.com', password='secret123', role='student')

        profile = Student.objects.create(user=user, room_number='A12', monthly_fee='1800.00')

        self.assertEqual(profile.user, user)
        self.assertTrue(profile.active)
