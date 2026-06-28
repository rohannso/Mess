from datetime import datetime

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from students.models import Student
from .models import Attendance, MealRate
from .serializers import AttendanceSerializer, MealRateSerializer

User = get_user_model()


def get_requested_date(request):
    value = request.data.get('date') or request.query_params.get('date')
    if not value:
        return datetime.now().date()
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def set_attendance_slot(record, slot, present=True):
    now = datetime.now()
    if slot == 'afternoon':
        record.afternoon = present
        record.afternoon_time = now if present else None
    elif slot == 'night':
        record.night = present
        record.night_time = now if present else None
    else:
        return False

    record.save()
    return True


class AttendanceListCreateView(generics.ListCreateAPIView):
    queryset = Attendance.objects.select_related('student__user').all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class AttendanceByStudentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        records = Attendance.objects.filter(student_id=student_id).order_by('-date')
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request, student_id):
        student = None
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            student = Student.objects.filter(user_id=student_id).first()
            if student is None:
                user = User.objects.filter(id=student_id, role='student').first()
                if user is not None:
                    student, _ = Student.objects.get_or_create(user=user, defaults={'room_number': '', 'monthly_fee': 0})

        if student is None:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role != 'admin' and student.user_id != request.user.id:
            return Response({'detail': 'You cannot update this student.'}, status=status.HTTP_403_FORBIDDEN)

        requested_date = get_requested_date(request)
        if requested_date is None:
            return Response({'detail': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        record, _ = Attendance.objects.get_or_create(student=student, date=requested_date)
        slot = request.data.get('slot')
        present = request.data.get('present', True)

        if not set_attendance_slot(record, slot, present):
            return Response({'detail': 'Invalid slot'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AttendanceSerializer(record).data)


class AttendanceMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_student(self, user):
        student = Student.objects.filter(user=user).first()
        if student is None and user.role == 'student':
            student, _ = Student.objects.get_or_create(user=user, defaults={'room_number': '', 'monthly_fee': 0})
        return student

    def get(self, request):
        student = self.get_student(request.user)
        if student is None:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        records = Attendance.objects.filter(student=student).order_by('-date')
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request):
        student = self.get_student(request.user)
        if student is None:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        requested_date = get_requested_date(request)
        if requested_date is None:
            return Response({'detail': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        record, _ = Attendance.objects.get_or_create(student=student, date=requested_date)
        slot = request.data.get('slot')
        if slot == 'afternoon':
            if record.afternoon:
                return Response({'detail': 'Afternoon attendance already marked'}, status=status.HTTP_400_BAD_REQUEST)
            record.afternoon = True
            record.afternoon_time = datetime.now()
        elif slot == 'night':
            if record.night:
                return Response({'detail': 'Night attendance already marked'}, status=status.HTTP_400_BAD_REQUEST)
            record.night = True
            record.night_time = datetime.now()
        else:
            return Response({'detail': 'Invalid slot'}, status=status.HTTP_400_BAD_REQUEST)

        record.save()
        return Response(AttendanceSerializer(record).data)


class MealRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rates = MealRate.objects.all()
        date_value = request.query_params.get('date')
        if date_value:
            rates = rates.filter(date=date_value)
        serializer = MealRateSerializer(rates, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admin can change rates.'}, status=status.HTTP_403_FORBIDDEN)

        requested_date = get_requested_date(request)
        if requested_date is None:
            return Response({'detail': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        rate, _ = MealRate.objects.get_or_create(date=requested_date)
        serializer = MealRateSerializer(rate, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(date=requested_date)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
