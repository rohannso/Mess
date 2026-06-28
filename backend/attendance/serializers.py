from rest_framework import serializers

from .models import Attendance, MealRate


class AttendanceSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.user.email', read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = (
            'id',
            'student',
            'student_name',
            'student_email',
            'date',
            'afternoon',
            'afternoon_time',
            'night',
            'night_time',
            'status',
            'total_amount',
        )

    def get_status(self, obj):
        if obj.afternoon and obj.night:
            return 'full'
        if obj.afternoon:
            return 'afternoon'
        if obj.night:
            return 'night'
        return 'none'

    def get_total_amount(self, obj):
        rate = MealRate.objects.filter(date=obj.date).first()
        if rate is None:
            return '0.00'

        total = 0
        if obj.afternoon:
            total += rate.afternoon_rate
        if obj.night:
            total += rate.night_rate
        return f'{total:.2f}'


class MealRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealRate
        fields = ('id', 'date', 'afternoon_name', 'afternoon_rate', 'night_name', 'night_rate', 'note')
