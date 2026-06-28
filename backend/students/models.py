from django.db import models

from accounts.models import User


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    room_number = models.CharField(max_length=20, blank=True)
    joining_date = models.DateField(auto_now_add=True)
    monthly_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.email
