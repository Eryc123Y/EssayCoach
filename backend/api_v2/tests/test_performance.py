"""
Performance tests for Django Ninja API v2
Benchmarks for high-frequency endpoints
"""

import pytest
import time
from django.test import Client

from api_v1.core.models import User, Unit, Class, MarkingRubric, Task


@pytest.fixture
def create_test_data():
    """Create test data for performance testing."""
    # Create test user
    user = User.objects.create_user(
        user_email="perf_test@example.com",
        password="TestPass123!",
        user_role="admin",
    )
    
    # Create test units
    units = []
    for i in range(100):
        unit = Unit.objects.create(
            unit_id=f"UNIT{i:03d}",
            unit_name=f"Test Unit {i}",
            unit_desc=f"Description for unit {i}",
        )
        units.append(unit)
    
    # Create test classes
    classes = []
    for i in range(50):
        cls = Class.objects.create(
            unit_id_unit=units[i % len(units)],
            class_size=30,
        )
        classes.append(cls)
    
    # Create test rubrics
    rubrics = []
    for i in range(25):
        rubric = MarkingRubric.objects.create(
            user_id_user=user,
            rubric_desc=f"Test Rubric {i}",
        )
        rubrics.append(rubric)
    
    return {
        'user': user,
        'units': units,
        'classes': classes,
        'rubrics': rubrics,
    }


@pytest.mark.django_db
def test_units_list_performance(create_test_data):
    """Benchmark units list endpoint performance."""
    from api_v2.core.views import list_units
    from django.http import HttpRequest
    from api_v2.core.schemas import UnitFilterParams
    
    # Create mock request
    request = HttpRequest()
    request.method = 'GET'
    
    # Warm up
    filters = UnitFilterParams()
    list_units(request, filters)
    
    # Benchmark
    start_time = time.time()
    iterations = 100
    
    for _ in range(iterations):
        list_units(request, filters)
    
    elapsed = time.time() - start_time
    avg_time = elapsed / iterations * 1000  # Convert to ms
    
    print(f"\nUnits list: {avg_time:.2f}ms per request ({iterations} iterations)")
    
    # Assert reasonable performance (should complete in less than 50ms per request)
    assert avg_time < 50, f"Performance regression: {avg_time:.2f}ms per request"


@pytest.mark.django_db
def test_classes_list_performance(create_test_data):
    """Benchmark classes list endpoint performance."""
    from api_v2.core.views import list_classes
    from django.http import HttpRequest
    from api_v2.core.schemas import ClassFilterParams
    
    request = HttpRequest()
    request.method = 'GET'
    
    # Create filter params (updated for FilterSchema)
    filters = ClassFilterParams()
    
    # Warm up
    list_classes(request, filters)
    
    # Benchmark
    start_time = time.time()
    iterations = 100
    
    for _ in range(iterations):
        list_classes(request, filters)
    
    elapsed = time.time() - start_time
    avg_time = elapsed / iterations * 1000
    
    print(f"\nClasses list: {avg_time:.2f}ms per request ({iterations} iterations)")
    
    assert avg_time < 50


@pytest.mark.django_db
def test_rubrics_list_performance(create_test_data):
    """Benchmark rubrics list endpoint performance."""
    from api_v2.core.views import list_rubrics
    from django.http import HttpRequest
    from api_v2.core.schemas import RubricFilterParams
    from unittest.mock import MagicMock
    
    request = HttpRequest()
    request.method = 'GET'
    # Mock auth attribute required by list_rubrics
    request.auth = create_test_data['user']
    
    # Create filter params (updated for FilterSchema)
    filters = RubricFilterParams()
    
    # Warm up
    list_rubrics(request, filters)
    
    # Benchmark
    start_time = time.time()
    iterations = 100
    
    for _ in range(iterations):
        list_rubrics(request, filters)
    
    elapsed = time.time() - start_time
    avg_time = elapsed / iterations * 1000
    
    print(f"\nRubrics list: {avg_time:.2f}ms per request ({iterations} iterations)")
    
    assert avg_time < 50


@pytest.mark.django_db
def test_filter_performance(create_test_data):
    """Benchmark filter functionality performance."""
    from api_v2.core.schemas import UnitFilterParams
    from api_v1.core.models import Unit
    
    # Create filter params
    filters = UnitFilterParams(unit_name="Test")
    
    # Benchmark filtering
    start_time = time.time()
    iterations = 100
    
    for _ in range(iterations):
        qs = filters.filter(Unit.objects.all())
        list(qs)  # Force evaluation
    
    elapsed = time.time() - start_time
    avg_time = elapsed / iterations * 1000
    
    print(f"\nFilter operation: {avg_time:.2f}ms per request ({iterations} iterations)")
    
    assert avg_time < 100


@pytest.mark.django_db
def test_modelschema_serialization_performance(create_test_data):
    """Benchmark ModelSchema serialization performance."""
    from api_v2.core.schemas import UnitOut
    from api_v1.core.models import Unit
    
    units = Unit.objects.all()[:50]
    
    start_time = time.time()
    iterations = 100
    
    for _ in range(iterations):
        for unit in units:
            UnitOut.from_orm(unit)
    
    elapsed = time.time() - start_time
    avg_time = elapsed / iterations * 1000
    
    print(f"\nModelSchema serialization: {avg_time:.2f}ms for {len(units)} objects ({iterations} iterations)")
    
    assert avg_time < 100


@pytest.mark.django_db
def test_pagination_performance(create_test_data):
    """Benchmark pagination performance."""
    from api_v2.core.views import paginate
    from api_v1.core.models import Unit
    from api_v2.core.schemas import PaginationParams
    
    qs = Unit.objects.all()
    
    start_time = time.time()
    iterations = 100
    
    for _ in range(iterations):
        params = PaginationParams(page=1, page_size=50)
        paginate(qs, params)
    
    elapsed = time.time() - start_time
    avg_time = elapsed / iterations * 1000
    
    print(f"\nPagination: {avg_time:.2f}ms per request ({iterations} iterations)")
    
    assert avg_time < 50
