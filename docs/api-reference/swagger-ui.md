# Swagger UI

<link
  rel="stylesheet"
  type="text/css"
  href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css"
/>

<style>
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 20px 0; }
  #swagger-ui-container {
    min-height: 500px;
  }
  .swagger-loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
    color: #10b981;
    font-family: "Inter", sans-serif;
    font-size: 16px;
  }
  .swagger-loading .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .swagger-ui .info .title {
    color: #10b981;
  }
</style>

<div id="swagger-ui-container">
  <div class="swagger-loading">
    <div class="spinner"></div>
    <div>Loading API Documentation...</div>
  </div>
</div>

<script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" charset="UTF-8"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>

<script type="text/javascript">
  // Initialize Swagger UI
  function initSwagger() {
    if (typeof SwaggerUIBundle === 'undefined' || typeof SwaggerUIBundle.SwaggerUIStandalonePreset === 'undefined') {
      setTimeout(initSwagger, 200);
      return;
    }
    
    // Clear loading state
    document.getElementById('swagger-ui-container').innerHTML = '';
    
    const schemaUrl = new URL('../openapi-schema.json', window.location.href).href;

    SwaggerUIBundle({
      url: schemaUrl,
      dom_id: '#swagger-ui-container',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
      ]
    });
  }

  // Start initialization when page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwagger);
  } else {
    initSwagger();
  }
</script>
