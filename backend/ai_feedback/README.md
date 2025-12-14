# AI Feedback App Documentation

## Overview

The AI Feedback app provides intelligent essay analysis and feedback generation using agentic workflows and prompt engineering. This app serves as the core intelligence layer of the EssayCoach platform, orchestrating AI agents to analyze student essays and provide detailed, actionable feedback to improve writing skills.

## Features

### Agentic Workflow Engine
- **Multi-Agent System**: Specialized agents for different aspects of essay analysis
- **Prompt Engineering**: Advanced prompt templates and context management
- **Workflow Orchestration**: Coordinated agent interactions for comprehensive analysis
- **DIFY Integration**: Early-stage integration with DIFY platform for workflow management
- **LangChain Migration Path**: Future migration to LangChain for complex workflows

### Essay Analysis
- **Structure Analysis**: Organization, flow, and coherence evaluation
- **Content Assessment**: Argument strength, evidence quality, and thesis clarity
- **Writing Style**: Tone, voice, and stylistic appropriateness
- **Grammar & Mechanics**: Language mechanics and clarity improvements
- **Context-Aware Feedback**: Personalized feedback based on essay type and level

### Feedback Generation
- **Actionable Suggestions**: Specific, implementable improvement recommendations
- **Progressive Guidance**: Step-by-step improvement pathways
- **Example Integration**: Relevant examples and templates for learning
- **Multi-format Output**: Structured feedback for reports and notifications

### Integration & Extensibility
- **API-First Design**: RESTful APIs for integration with other apps
- **Plugin Architecture**: Extensible system for new analysis types
- **Configuration Management**: Flexible prompt and workflow configuration
- **Performance Monitoring**: Track analysis quality and response times

## Models

### EssayAnalysis
Core analysis results for submitted essays:
- `essay_id`: Foreign key to EssaySubmission
- `overall_score`: Composite evaluation score
- `structure_analysis`: JSON analysis of organization and flow
- `content_analysis`: JSON analysis of arguments and evidence
- `style_analysis`: JSON analysis of writing style and tone
- `grammar_notes`: JSON array of language mechanics issues
- `feedback_summary`: Generated feedback overview
- `agent_workflow_id`: Reference to workflow used
- `processing_metadata`: JSON metadata about analysis process

### AnalysisWorkflow
Workflow configuration and tracking:
- `workflow_name`: Human-readable workflow name
- `workflow_type`: Type of analysis workflow
- `prompt_templates`: JSON configuration of prompts used
- `agent_config`: JSON agent configuration
- `is_active`: Whether workflow is currently active
- `performance_metrics`: JSON performance tracking data

### FeedbackTemplate
Reusable feedback templates:
- `template_name`: Template identifier
- `template_type`: Type of feedback template
- `prompt_structure`: JSON prompt template structure
- `variables`: JSON schema for template variables
- `use_case`: Target use case description

## API Endpoints

### Essay Analysis
```
POST /ai-feedback/analyze/          # Submit essay for AI analysis
GET  /ai-feedback/analysis/{id}/    # Get analysis results
PUT  /ai-feedback/regenerate/{id}/  # Regenerate feedback with new workflow
```

### Workflow Management
```
GET  /ai-feedback/workflows/        # List available workflows
POST /ai-feedback/workflows/        # Create new workflow configuration
PUT  /ai-feedback/workflows/{id}/   # Update workflow configuration
```

### Feedback Management
```
GET  /ai-feedback/feedback/{id}/    # Get detailed feedback
PUT  /ai-feedback/feedback/{id}/    # Update feedback (human correction)
```

## Configuration

### Settings Required
Add to your Django settings:

```python
INSTALLED_APPS = [
    # ... other apps
    'ai_feedback',
]

# AI Service Configuration
AI_SERVICE_CONFIG = {
    'DIFY_API_KEY': 'your-dify-api-key',
    'DIFY_BASE_URL': 'https://api.dify.ai',
    'WORKFLOW_TIMEOUT': 300,  # seconds
    'MAX_RETRIES': 3,
}

# Analysis Settings
ESSAY_ANALYSIS_CONFIG = {
    'MAX_ESSAY_LENGTH': 10000,  # characters
    'SUPPORTED_LANGUAGES': ['en', 'es', 'fr', 'de'],
    'ENABLE_CACHE': True,
    'CACHE_TTL': 3600,  # seconds
}

# Future Migration Settings
LANGCHAIN_CONFIG = {
    'ENABLE_LANGCHAIN': False,  # Set to True for future migration
    'OPENAI_API_KEY': 'your-openai-key',  # For future use
    'ANTHROPIC_API_KEY': 'your-anthropic-key',  # For future use
}
```

## Testing

Run tests for the AI feedback app:

```bash
python manage.py test ai_feedback
```

### Test Coverage
- Agent workflow execution
- Prompt template rendering
- API integration tests
- Feedback quality validation
- Error handling and edge cases
- Performance testing

## Security Considerations

1. **API Key Security**: Store API keys securely using environment variables
2. **Rate Limiting**: Implement rate limiting for AI service calls
3. **Data Privacy**: Ensure essay content is handled securely
4. **Content Filtering**: Filter inappropriate content before analysis
5. **Access Control**: Restrict access to analysis endpoints
6. **Audit Logging**: Log all analysis requests for compliance

## Development

### Adding New Analysis Types
1. Define new workflow configuration
2. Create prompt templates
3. Configure agent interactions
4. Test with sample essays
5. Update documentation

### Workflow Enhancements
1. Design new agent workflows
2. Optimize prompt effectiveness
3. Add new feedback categories
4. Improve response quality

### Migration Planning
1. Plan DIFY to LangChain migration
2. Design extensible architecture
3. Maintain backward compatibility
4. Document migration steps

## Dependencies

- Django >= 4.2
- djangorestframework
- requests (for API calls)
- celery (for async processing)
- redis (for caching)

## Dify Workflow Agent APIs

### Required configuration

- `.env` must define:
  - `DIFY_API_KEY` (server-side only)
  - `DIFY_WORKFLOW_ID` or `DIFY_DEFAULT_WORKFLOW_ID` (published workflow)
  - `DIFY_BASE_URL` (optional, defaults to `https://api.dify.ai/v1`)
  - `DIFY_DEFAULT_WORKFLOW_ID` mirrors the published version used by the Essay Agent

### Endpoints

#### `POST /api/v1/ai-feedback/agent/workflows/run/`
-+- **Purpose**: Trigger the Essay Agent workflow using the bundled `rubric.pdf` located at the repository root. The view uploads the rubric once per user identifier and sends it as the `essay_rubric` file array required by the Dify DSL.
- **Request body** (JSON):
  ```json
  {
    "essay_question": "The task prompt students are answering",
    "essay_content": "Full student essay text (max ~20k chars)",
    "language": "English",            # optional language hint
    "response_mode": "blocking",      # choose streaming or blocking
    "user_id": "student-123"          # optional override for Dify user tracking
  }
  ```
- **File input**: The API automatically populates `essay_rubric` using `rubric.pdf` as:
  ```json
  "essay_rubric": [{
    "transfer_method": "local_file",
    "upload_file_id": "<id-from-dify>",
    "type": "document"
  }]
  ```
- **Response**: Returns `workflow_run_id`, `task_id`, `data`, and the recorded inputs for frontend tracing.

#### `POST /api/v1/ai-feedback/agent/workflows/{workflow_id}/run/`
- Same payload as above but lets frontend lock a specific published workflow version per URL path (overrides the default `DIFY_DEFAULT_WORKFLOW_ID`).

#### `GET /api/v1/ai-feedback/agent/workflows/run/{workflow_run_id}/status/`
- Fetches the latest Dify workflow run metadata (`status`, `outputs`, `elapsed_time`, tokens, etc.). Useful for polling after a blocking run or retrieving final output after streaming.

> **Note:** `workflow_id` is returned by Dify inside responses and identifies the workflow definition. It does not get submitted in the request body—only `inputs`, `response_mode`, and `user` are needed when calling the run endpoint.

### Sample cURL (blocking)

```bash
curl -X POST http://localhost:8000/api/v1/ai-feedback/agent/workflows/run/ \
  -H "Authorization: Token <your-token>" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "essay_question": "Explain the importance of biodiversity.",
    "essay_content": "Saved essay text goes here...",
    "response_mode": "blocking",
    "user_id": "student-123"
  }'
```

### Notes for frontend

- Always send `essay_question` and `essay_content`. The `essay_rubric` file is handled server-side (the rubric PDF is never uploaded by the client).
- `response_mode` can be `blocking` for synchronous responses or `streaming` when you want to consume SSE chunks later (the backend still returns the workflow metadata immediately).
- Use the `/status/` endpoint to poll for completion when the run returns `status != "succeeded"`.

## Contributing

When contributing to the AI feedback app:
1. Focus on prompt effectiveness over model details
2. Test workflows with diverse essay samples
3. Ensure feedback is constructive and educational
4. Document workflow changes clearly
5. Consider future migration paths
6. Maintain API stability
