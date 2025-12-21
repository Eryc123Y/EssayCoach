# Serializers & Views

## 🏗️ Django REST Framework Architecture

EssayCoach uses Django REST Framework (DRF) to create a clean separation between models and API representations, with comprehensive serializers and viewsets for educational workflows.

## 📋 Serializers Overview

### Base Serializer Patterns

#### Model Serializers
```python
# backend/essay_submission/serializers.py
from rest_framework import serializers
from .models import Essay, EssayVersion, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'academic_level']
        read_only_fields = ['id']

class EssaySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    feedback_count = serializers.IntegerField(read_only=True)
    overall_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Essay
        fields = [
            'id', 'title', 'content', 'category', 'category_name',
            'status', 'word_count', 'character_count', 'reading_time_minutes',
            'user_email', 'feedback_count', 'overall_score',
            'created_at', 'updated_at', 'submitted_at'
        ]
        read_only_fields = [
            'id', 'word_count', 'character_count', 'reading_time_minutes',
            'status', 'created_at', 'updated_at', 'submitted_at'
        ]
    
    def validate_content(self, value):
        """Validate essay content"""
        word_count = len(value.split())
        if word_count < 50:
            raise serializers.ValidationError("Essay must be at least 50 words")
        if word_count > 5000:
            raise serializers.ValidationError("Essay cannot exceed 5000 words")
        return value
    
    def create(self, validated_data):
        """Create essay with computed fields"""
        content = validated_data['content']
        validated_data['word_count'] = len(content.split())
        validated_data['character_count'] = len(content)
        validated_data['reading_time_minutes'] = max(1, len(content.split()) // 200)
        return super().create(validated_data)

class EssayDetailSerializer(EssaySerializer):
    """Detailed essay serializer with relationships"""
    feedback = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    
    class Meta(EssaySerializer.Meta):
        fields = EssaySerializer.Meta.fields + ['feedback', 'versions']
    
    def get_feedback(self, obj):
        """Get essay feedback"""
        from ai_feedback.serializers import FeedbackSerializer
        return FeedbackSerializer(obj.feedback.all(), many=True).data
    
    def get_versions(self, obj):
        """Get essay versions"""
        from .serializers import EssayVersionSerializer
        return EssayVersionSerializer(obj.versions.all()[:5], many=True).data
```

#### Nested Serializers
```python
# backend/ai_feedback/serializers.py
from rest_framework import serializers
from .models import Feedback, FeedbackType, AIResponse

class FeedbackTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackType
        fields = ['id', 'name', 'description', 'weight', 'order']

class FeedbackSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='type.name', read_only=True)
    suggestions = serializers.JSONField(default=list)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'type', 'type_name', 'score', 'max_score', 'confidence',
            'feedback', 'suggestions', 'highlighted_text',
            'start_index', 'end_index', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class AIResponseSerializer(serializers.ModelSerializer):
    essay_title = serializers.CharField(source='essay.title', read_only=True)
    
    class Meta:
        model = AIResponse
        fields = [
            'id', 'essay', 'essay_title', 'feedback_type', 'prompt',
            'response', 'model_name', 'model_version', 'tokens_used',
            'processing_time_seconds', 'cost_usd', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class FeedbackCreateSerializer(serializers.Serializer):
    """Serializer for creating feedback via API"""
    essay_id = serializers.IntegerField()
    feedback_types = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    
    def validate_essay_id(self, value):
        from essay_submission.models import Essay
        try:
            return Essay.objects.get(id=value)
        except Essay.DoesNotExist:
            raise serializers.ValidationError("Essay not found")
```

### User Management Serializers
```python
# backend/auth/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    essay_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'institution', 'grade_level',
            'essay_count', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'role', 'institution'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'bio', 'avatar', 'timezone', 'preferences']
```

## 🎯 ViewSets & Views

### Base ViewSet Patterns

#### ModelViewSets
```python
# backend/essay_submission/views.py
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Essay, Category
from .serializers import EssaySerializer, EssayDetailSerializer, CategorySerializer
from .permissions import IsOwnerOrReadOnly

class EssayViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing essay submissions.
    
    Provides CRUD operations for essays with filtering and search.
    """
    queryset = Essay.objects.select_related('user', 'category').all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'user']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'word_count', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EssayDetailSerializer
        return EssaySerializer
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        if user.role == 'admin':
            return self.queryset
        return self.queryset.filter(user=user)
    
    def perform_create(self, serializer):
        """Set user on creation"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit essay for AI processing"""
        essay = self.get_object()
        if essay.status != 'draft':
            return Response(
                {'error': 'Essay already submitted'},
                status=400
            )
        
        essay.status = 'submitted'
        essay.submitted_at = timezone.now()
        essay.save()
        
        # Trigger AI analysis
        from ai_feedback.tasks import analyze_essay
        analyze_essay.delay(essay.id)
        
        return Response({'status': 'submitted for processing'})
    
    @action(detail=True, methods=['get'])
    def feedback(self, request, pk=None):
        """Get essay feedback"""
        essay = self.get_object()
        from ai_feedback.serializers import FeedbackSerializer
        from ai_feedback.models import Feedback
        
        feedback = Feedback.objects.filter(essay=essay)
        serializer = FeedbackSerializer(feedback, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_essays(self, request):
        """Get current user's essays"""
        essays = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(essays, many=True)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only categories"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = None
```

#### Custom Permissions
```python
# backend/essay_submission/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner or admin
        return obj.user == request.user or request.user.role == 'admin'

class IsEducatorOrAdmin(permissions.BasePermission):
    """Allow educators and admins to access"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['educator', 'admin']
```

### User Management Views
```python
# backend/auth/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserRegistrationSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    User management ViewSet
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Instantiate and return permissions for actions"""
        if self.action == 'create':
            return [permissions.AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """User registration endpoint"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def essays(self, request, pk=None):
        """Get user's essays"""
        user = self.get_object()
        from essay_submission.serializers import EssaySerializer
        from essay_submission.models import Essay
        
        essays = Essay.objects.filter(user=user)
        serializer = EssaySerializer(essays, many=True)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with user data"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Add user data to response
        from auth.serializers import UserSerializer
        user = User.objects.get(username=request.data['username'])
        response.data['user'] = UserSerializer(user).data
        
        return response
```

### Dify Workflow Agent Views

The `ai_feedback` app exposes three new API endpoints that wrap the Essay Agent DSL and surface the Dify workflow run/status APIs via DRF and drf-spectacular. The request schema is defined in `backend/ai_feedback/serializers.py`.

```python
# backend/ai_feedback/serializers.py
class DifyWorkflowRunSerializer(serializers.Serializer):
    essay_question = serializers.CharField(max_length=2000)
    essay_content = serializers.CharField(max_length=20000)
    language = serializers.CharField(max_length=48, required=False, default="English")
    response_mode = serializers.ChoiceField(choices=("blocking", "streaming"), default="blocking")
    user_id = serializers.CharField(max_length=128, required=False)
```

The serializer ensures `language` and `response_mode` default to valid values and adds a `user_id` that the backend uses when talking to Dify. The view described in `backend/ai_feedback/views.py` attaches the root-level `rubric.pdf` file as the required `essay_rubric` variable by uploading it through `DifyClient` and converting it into a file-array payload.

The new endpoints are:

- `POST /api/v1/ai-feedback/agent/workflows/run/` – triggers the default workflow while sending the DSL inputs. The response includes `workflow_run_id`, `task_id`, `data`, and the input payload.
- `POST /api/v1/ai-feedback/agent/workflows/{workflow_id}/run/` – executes a pinned workflow version from the URL.
- `GET /api/v1/ai-feedback/agent/workflows/run/{workflow_run_id}/status/` – proxies Dify’s `/workflows/run/{workflow_run_id}` endpoint so the frontend can poll for `status`, `outputs`, and token usage.
- **Note**: `workflow_id` only exists in the Dify response payload (it names the workflow definition). You never supply it in the POST body; Dify infers it from the published workflow being executed.

Each view is decorated with `extend_schema` to render precise request/response documentation in Swagger (matching the `auth`/`core` style), helping frontend developers know exactly how to format the JSON body and what to expect back.

### AI Feedback Views
```python
# backend/ai_feedback/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from celery.result import AsyncResult
from .models import Feedback, FeedbackType, AIResponse
from .serializers import FeedbackSerializer, FeedbackTypeSerializer
from .tasks import analyze_essay_task

class FeedbackViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only feedback ViewSet
    """
    queryset = Feedback.objects.select_related('essay', 'type').all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['essay', 'type']
    
    def get_queryset(self):
        """Only show feedback for user's essays"""
        user = self.request.user
        if user.role == 'admin':
            return self.queryset
        return self.queryset.filter(essay__user=user)

class FeedbackTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """Feedback types"""
    queryset = FeedbackType.objects.filter(is_active=True)
    serializer_class = FeedbackTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

class AIProcessingViewSet(viewsets.ViewSet):
    """AI processing endpoints"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Trigger AI analysis for essay"""
        essay_id = request.data.get('essay_id')
        feedback_types = request.data.get('feedback_types', [])
        
        if not essay_id:
            return Response(
                {'error': 'essay_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate essay ownership
        from essay_submission.models import Essay
        try:
            essay = Essay.objects.get(id=essay_id, user=request.user)
        except Essay.DoesNotExist:
            return Response(
                {'error': 'Essay not found or not owned by user'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Trigger async analysis
        task = analyze_essay_task.delay(essay.id, feedback_types)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'AI analysis started'
        })
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get AI processing status"""
        task = AsyncResult(pk)
        
        return Response({
            'task_id': pk,
            'status': task.status,
            'result': task.result if task.ready() else None
        })
```

## 🎯 Filtering & Searching

### Custom Filters
```python
# backend/essay_submission/filters.py
import django_filters
from .models import Essay

class EssayFilter(django_filters.FilterSet):
    """Custom filters for essays"""
    
    title = django_filters.CharFilter(lookup_expr='icontains')
    content = django_filters.CharFilter(lookup_expr='icontains')
    created_after = django_filters.DateTimeFilter(
        field_name='created_at', lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at', lookup_expr='lte'
    )
    word_count_min = django_filters.NumberFilter(
        field_name='word_count', lookup_expr='gte'
    )
    word_count_max = django_filters.NumberFilter(
        field_name='word_count', lookup_expr='lte'
    )
    
    class Meta:
        model = Essay
        fields = [
            'status', 'category', 'user',
            'title', 'content',
            'created_after', 'created_before',
            'word_count_min', 'word_count_max'
        ]
```

## 🚨 Error Handling

### Custom Exception Handling
```python
# backend/core/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """Custom exception handler"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # Add custom error format
        response.data = {
            'error': {
                'code': response.status_code,
                'message': response.data.get('detail', 'An error occurred'),
                'details': response.data
            }
        }
    
    return response
```

### Validation Error Format
```python
# Consistent error format
{
    "error": {
        "code": 400,
        "message": "Validation failed",
        "details": {
            "title": ["This field is required"],
            "content": ["Essay must be at least 50 words"]
        }
    }
}
```