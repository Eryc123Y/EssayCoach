from rest_framework import serializers
from .models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'


class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'


class MarkingRubricSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarkingRubric
        fields = '__all__'


class RubricItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricItem
        fields = '__all__'


class RubricLevelDescSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricLevelDesc
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'


class FeedbackItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackItem
        fields = '__all__'


class TeachingAssnSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingAssn
        fields = '__all__'


