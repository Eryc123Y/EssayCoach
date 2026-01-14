# AI Feedback API Test Coverage Report

## Overview
This document summarizes the test coverage for the `ai_feedback` app's API endpoints, specifically focusing on the `WorkflowRunView` POST endpoint.

## Test File Location
`backend/ai_feedback/tests.py`

## Test Classes and Coverage

### 1. `DifyWorkflowAPITestCase` (Base Class)
**Purpose**: Sets up test fixtures and provides common utilities.

**Setup Includes**:
- Test user creation with authentication
- Sample essay question and content for testing
- Mock Dify response with frontend-expected outputs structure
- Helper method for building valid payloads

### 2. `WorkflowRunViewTests`
**Endpoint**: `POST /api/v1/ai-feedback/agent/workflows/run/`

**Tests**:
- ✅ `test_run_workflow_success`: Verifies successful workflow execution and response structure
- ✅ `test_run_workflow_with_defaults`: Tests default values (language="English", response_mode="blocking")
- ✅ `test_run_workflow_with_custom_language`: Tests custom language parameter
- ✅ `test_run_workflow_streaming_mode`: Tests streaming response mode
- ✅ `test_run_workflow_missing_required_fields`: Tests validation (400 Bad Request)
- ✅ `test_run_workflow_unauthorized`: Tests authentication (403 Forbidden)
- ✅ `test_run_workflow_dify_error`: Tests DifyClientError handling (502 Bad Gateway)

### 3. `WorkflowRunStatusViewTests`
**Endpoint**: `GET /api/v1/ai-feedback/agent/workflows/run/{workflow_run_id}/status/`

**Tests**:
- ✅ `test_get_workflow_status_success`: Tests successful status retrieval
- ✅ `test_get_workflow_status_dify_error`: Tests error handling
- ✅ `test_get_workflow_status_unauthorized`: Tests authentication

### 4. `DifyWorkflowRunSerializerTests`
**Purpose**: Tests the request serializer validation

**Tests**:
- ✅ `test_serializer_valid_data`: Tests valid data validation
- ✅ `test_serializer_defaults`: Tests default value application
- ✅ `test_serializer_missing_required_fields`: Tests required field validation
- ✅ `test_serializer_invalid_response_mode`: Tests response_mode validation
- ✅ `test_serializer_empty_strings`: Tests empty string rejection

### 5. `WorkflowRunViewResponseTests`
**Purpose**: Additional tests for response structure compliance

**Tests**:
- ✅ `test_response_contains_all_expected_fields`: Comprehensive response structure verification
- ✅ `test_response_mode_blocking`: Tests blocking mode response
- ✅ `test_response_mode_streaming`: Tests streaming mode response
- ✅ `test_inputs_contain_language_parameter`: Tests language parameter in inputs
- ✅ `test_workflow_error_response_format`: Tests error response format
- ✅ `test_outputs_structure_for_frontend_consumption`: Verifies nested outputs structure
- ✅ `test_rubric_file_input_structure`: Tests rubric file input formatting

## Mock Response Structure

The tests use a comprehensive mock response that matches the frontend's expected structure:

```python
{
    "workflow_run_id": "test-run-id-12345",
    "task_id": "test-task-id-67890",
    "data": {
        "id": "test-run-id-12345",
        "workflow_id": "test-workflow-id",
        "status": "succeeded",
        "outputs": {
            "text": "Mock feedback output",
            "structure_analysis": {
                "score": 8,
                "feedback": "The essay has a clear introduction and thesis statement.",
                "suggestions": ["Consider adding more topic sentences in body paragraphs."]
            },
            "content_analysis": {
                "score": 7,
                "feedback": "Arguments are well-supported with evidence.",
                "suggestions": ["Include more recent sources to support claims."]
            },
            "writing_style": {
                "score": 9,
                "feedback": "Academic tone is consistent throughout.",
                "suggestions": ["Minor grammar corrections needed in paragraph 3."]
            }
        },
        "error": None,
        "elapsed_time": 2.5,
        "total_tokens": 1500,
        "total_steps": 3,
        "created_at": 1705407629,
        "finished_at": 1705407631,
    }
}
```

## API Contract Compliance Verification

### Required Response Fields (Verified by Tests)
1. ✅ `workflow_run_id` - String identifier for the workflow run
2. ✅ `task_id` - String identifier for the task
3. ✅ `data` - Dictionary containing workflow execution details
4. ✅ `inputs` - Dictionary containing the inputs sent to Dify
5. ✅ `response_mode` - String indicating "blocking" or "streaming"

### Frontend-Expected Outputs Structure (Verified by Tests)
1. ✅ `data.outputs.structure_analysis` - Contains score, feedback, suggestions
2. ✅ `data.outputs.content_analysis` - Contains score, feedback, suggestions
3. ✅ `data.outputs.writing_style` - Contains score, feedback, suggestions

### Error Response Format (Verified by Tests)
1. ✅ `error` field present in error responses
2. ✅ Appropriate HTTP status codes (400, 403, 500, 502)

## DifyClient Mocking Strategy
- All tests use `@patch("ai_feedback.views.DifyClient")` decorator
- Mock client properly configured with:
  - `get_rubric_upload_id.return_value`
  - `build_rubric_file_input.return_value`
  - `run_workflow.return_value` (or `side_effect` for error testing)

## Running the Tests

### With pytest (recommended):
```bash
cd backend
pytest ai_feedback/tests.py -v
```

### With Django's test runner:
```bash
cd backend
python manage.py test ai_feedback
```

## Test Configuration Files
- `backend/pytest.ini` - Pytest configuration
- `backend/ai_feedback/conftest.py` - Pytest fixtures and Django configuration

## Summary
✅ **All API contract requirements are met**
✅ **Frontend expected response structure is verified**
✅ **DifyClient is properly mocked to avoid external calls**
✅ **Error handling is thoroughly tested**
✅ **Input validation is covered**
✅ **Authentication and authorization are tested**

The test suite ensures API contract compliance and provides comprehensive coverage of the `WorkflowRunView` endpoint functionality.
