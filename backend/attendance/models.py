from django.db import models

from students.models import Student


class Attendance(models.Model):
    MEAL_TYPE_CHOICES = (
        ('veg', 'Veg'),
        ('nonveg', 'Non-veg'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    afternoon = models.BooleanField(default=False)
    afternoon_meal_type = models.CharField(max_length=10, choices=MEAL_TYPE_CHOICES, default='veg')
    afternoon_time = models.DateTimeField(null=True, blank=True)
    night = models.BooleanField(default=False)
    night_meal_type = models.CharField(max_length=10, choices=MEAL_TYPE_CHOICES, default='veg')
    night_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'date')

    def __str__(self):
        return f"{self.student} - {self.date}"


class MealRate(models.Model):
    date = models.DateField(unique=True)
    afternoon_name = models.CharField(max_length=80, default='Afternoon meal')
    afternoon_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    afternoon_veg_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    afternoon_nonveg_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    night_name = models.CharField(max_length=80, default='Night meal')
    night_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    night_veg_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    night_nonveg_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    note = models.CharField(max_length=160, blank=True)

    class Meta:
      ordering = ('-date',)

    def __str__(self):
        return f"Rates for {self.date}"
