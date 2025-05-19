document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('mcp-builder-form');
  const toolsContainer = document.getElementById('tools-container');
  const addToolBtn = document.getElementById('add-tool-btn');
  const submitBtn = document.getElementById('submit-btn');
  const resultContainer = document.getElementById('result-container');
  
  // Add tool handler
  addToolBtn.addEventListener('click', function() {
    const toolId = `tool-${Date.now()}`;
    const toolHtml = `
      <div class="tool-container" id="${toolId}">
        <div class="tool-header">
          <h3>Tool</h3>
          <button type="button" class="btn btn-danger remove-tool" data-tool-id="${toolId}">Remove Tool</button>
        </div>
        <div class="form-group">
          <label for="${toolId}-name">Tool Name</label>
          <input type="text" id="${toolId}-name" name="tools[][name]" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="${toolId}-description">Description</label>
          <textarea id="${toolId}-description" name="tools[][description]" class="form-control" rows="2" required></textarea>
        </div>
        <div class="parameters-section">
          <h4>Parameters</h4>
          <div class="parameters-container" id="${toolId}-parameters">
            <!-- Parameters will be added here -->
          </div>
          <button type="button" class="btn btn-add add-parameter" data-tool-id="${toolId}">Add Parameter</button>
        </div>
      </div>
    `;
    
    toolsContainer.insertAdjacentHTML('beforeend', toolHtml);
    
    // Add parameter event for this new tool
    document.querySelector(`#${toolId} .add-parameter`).addEventListener('click', function() {
      addParameter(toolId);
    });
    
    // Add remove tool event
    document.querySelector(`#${toolId} .remove-tool`).addEventListener('click', function() {
      document.getElementById(toolId).remove();
    });
    
    // Add the first parameter by default
    addParameter(toolId);
  });
  
  // Function to add a parameter to a tool
  function addParameter(toolId) {
    const parameterId = `param-${Date.now()}`;
    const parameterHtml = `
      <div class="parameter-container" id="${parameterId}">
        <div class="parameter-header">
          <h5>Parameter</h5>
          <button type="button" class="btn btn-danger remove-parameter" data-param-id="${parameterId}">Remove</button>
        </div>
        <div class="form-group">
          <label for="${parameterId}-name">Parameter Name</label>
          <input type="text" id="${parameterId}-name" name="tools[][parameters][][name]" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="${parameterId}-type">Type</label>
          <select id="${parameterId}-type" name="tools[][parameters][][type]" class="form-control">
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
        </div>
        <div class="form-group">
          <label for="${parameterId}-description">Description</label>
          <input type="text" id="${parameterId}-description" name="tools[][parameters][][description]" class="form-control" required>
        </div>
      </div>
    `;
    
    document.getElementById(`${toolId}-parameters`).insertAdjacentHTML('beforeend', parameterHtml);
    
    // Add remove parameter event
    document.querySelector(`#${parameterId} .remove-parameter`).addEventListener('click', function() {
      document.getElementById(parameterId).remove();
    });
  }
  
  // Form submit handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Server...';
    
    // Gather all the form data
    const serverName = document.getElementById('server-name').value;
    const description = document.getElementById('description').value;
    const serverType = document.getElementById('server-type').value;
    
    // Collect tools and their parameters
    const tools = [];
    document.querySelectorAll('.tool-container').forEach(toolElement => {
      const tool = {
        name: toolElement.querySelector('[name$="[name]"]').value,
        description: toolElement.querySelector('[name$="[description]"]').value,
        parameters: []
      };
      
      toolElement.querySelectorAll('.parameter-container').forEach(paramElement => {
        tool.parameters.push({
          name: paramElement.querySelector('[name$="[parameters][][name]"]').value,
          type: paramElement.querySelector('[name$="[parameters][][type]"]').value,
          description: paramElement.querySelector('[name$="[parameters][][description]"]').value
        });
      });
      
      tools.push(tool);
    });
    
    // Send the data to the server
    try {
      const response = await fetch('/api/create-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverName,
          description,
          serverType,
          tools
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        resultContainer.innerHTML = `
          <div class="alert alert-success">
            <h4>Server Created Successfully!</h4>
            <p>${data.message}</p>
            <a href="${data.downloadUrl}" class="btn btn-primary">Download MCP Server</a>
          </div>
        `;
        
        // Auto download
        window.location.href = data.downloadUrl;
      } else {
        resultContainer.innerHTML = `
          <div class="alert alert-danger">
            <h4>Error Creating Server</h4>
            <p>${data.error}</p>
          </div>
        `;
      }
    } catch (error) {
      resultContainer.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error Creating Server</h4>
          <p>An unexpected error occurred. Please try again.</p>
        </div>
      `;
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create MCP Server';
    
    // Scroll to the result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  });
  
  // Add the first tool by default
  addToolBtn.click();
});
