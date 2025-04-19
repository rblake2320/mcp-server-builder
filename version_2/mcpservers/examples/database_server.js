/**
 * Database Operations MCP Server
 * 
 * This example demonstrates an MCP server that provides tools for interacting
 * with databases, including:
 * - Querying data
 * - Creating, updating, and deleting records
 * - Schema information
 * - Database metrics
 * 
 * The implementation can be adapted for different database systems.
 * This example uses SQLite for simplicity, but you can modify it for
 * PostgreSQL, MySQL, MongoDB, etc.
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// Database file location
const dbFile = path.join(__dirname, 'database.sqlite');

// Initialize database connection
let db;

async function initializeDatabase() {
  // Open database connection
  db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );
  `);
  
  // Insert sample data if tables are empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  
  if (userCount.count === 0) {
    await db.run(`
      INSERT INTO users (name, email) VALUES 
      ('John Doe', 'john@example.com'),
      ('Jane Smith', 'jane@example.com'),
      ('Bob Johnson', 'bob@example.com')
    `);
    
    await db.run(`
      INSERT INTO products (name, description, price, category, stock) VALUES 
      ('Laptop', 'High-performance laptop', 1299.99, 'Electronics', 10),
      ('Smartphone', 'Latest smartphone model', 899.99, 'Electronics', 15),
      ('Headphones', 'Noise-cancelling headphones', 199.99, 'Audio', 20),
      ('Coffee Maker', 'Automatic coffee maker', 79.99, 'Kitchen', 8),
      ('Desk Chair', 'Ergonomic office chair', 249.99, 'Furniture', 5)
    `);
    
    await db.run(`
      INSERT INTO orders (user_id, total_amount, status) VALUES 
      (1, 1299.99, 'completed'),
      (2, 1099.98, 'shipped'),
      (3, 79.99, 'pending')
    `);
    
    await db.run(`
      INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
      (1, 1, 1, 1299.99),
      (2, 2, 1, 899.99),
      (2, 3, 1, 199.99),
      (3, 4, 1, 79.99)
    `);
  }
  
  console.log('Database initialized');
}

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Available tools
const TOOLS = [
  {
    name: 'query_data',
    description: 'Execute a SQL query to retrieve data from the database',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute (SELECT only)',
        },
        parameters: {
          type: 'object',
          description: 'Query parameters to bind',
          default: {}
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 100
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_records',
    description: 'Get records from a specified table with optional filtering',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        filters: {
          type: 'object',
          description: 'Filter conditions (field: value)',
          default: {}
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return',
          default: 100
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip',
          default: 0
        },
        order_by: {
          type: 'string',
          description: 'Field to order by',
          default: 'id'
        },
        order_direction: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Ordering direction',
          default: 'asc'
        }
      },
      required: ['table']
    }
  },
  {
    name: 'create_record',
    description: 'Create a new record in the specified table',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        data: {
          type: 'object',
          description: 'Record data (field: value)'
        }
      },
      required: ['table', 'data']
    }
  },
  {
    name: 'update_record',
    description: 'Update an existing record in the specified table',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        id: {
          type: 'number',
          description: 'ID of the record to update'
        },
        data: {
          type: 'object',
          description: 'Updated data (field: value)'
        }
      },
      required: ['table', 'id', 'data']
    }
  },
  {
    name: 'delete_record',
    description: 'Delete a record from the specified table',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        id: {
          type: 'number',
          description: 'ID of the record to delete'
        }
      },
      required: ['table', 'id']
    }
  },
  {
    name: 'get_schema',
    description: 'Get the schema information for the specified table',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        }
      },
      required: ['table']
    }
  },
  {
    name: 'get_tables',
    description: 'Get a list of all tables in the database',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_database_stats',
    description: 'Get statistics about the database',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Helper function to validate parameters against a tool's schema
 */
function validateParameters(tool, params) {
  const schema = tool.parameters;
  const errors = [];
  
  // Check required parameters
  for (const required of schema.required || []) {
    if (params[required] === undefined) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }
  
  // Check parameter types
  for (const [param, value] of Object.entries(params)) {
    const paramSchema = schema.properties[param];
    
    if (!paramSchema) {
      errors.push(`Unknown parameter: ${param}`);
      continue;
    }
    
    // Type checking
    if (paramSchema.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${param} must be a string`);
    } else if (paramSchema.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter ${param} must be a number`);
    } else if (paramSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter ${param} must be a boolean`);
    } else if (paramSchema.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter ${param} must be an array`);
    } else if (paramSchema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(`Parameter ${param} must be an object`);
    }
    
    // Enum validation
    if (paramSchema.enum && !paramSchema.enum.includes(value)) {
      errors.push(`Parameter ${param} must be one of: ${paramSchema.enum.join(', ')}`);
    }
  }
  
  return errors;
}

/**
 * Execute a SQL query
 */
async function queryData(query, parameters = {}, limit = 100) {
  try {
    // Security check: Only allow SELECT queries (prevent modifications)
    if (!query.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    // Add limit to the query if not already present
    if (!query.toLowerCase().includes('limit')) {
      query = `${query} LIMIT ${limit}`;
    }
    
    // Execute query with parameters
    const results = await db.all(query, parameters);
    
    return {
      results,
      count: results.length,
      query
    };
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

/**
 * Get records from a table with filtering
 */
async function getRecords(table, filters = {}, limit = 100, offset = 0, orderBy = 'id', orderDirection = 'asc') {
  try {
    // Check if the table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [table]
    );
    
    if (!tableExists) {
      throw new Error(`Table '${table}' does not exist`);
    }
    
    // Build query conditions from filters
    let conditions = [];
    let params = [];
    
    for (const [field, value] of Object.entries(filters)) {
      conditions.push(`${field} = ?`);
      params.push(value);
    }
    
    // Build the complete query
    let query = `SELECT * FROM ${table}`;
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    // Execute the query
    const results = await db.all(query, params);
    
    // Get total count (without limit and offset)
    let countQuery = `SELECT COUNT(*) as count FROM ${table}`;
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await db.get(countQuery, params);
    
    return {
      results,
      count: results.length,
      total: countResult.count,
      page: Math.floor(offset / limit) + 1,
      limit,
      offset
    };
  } catch (error) {
    throw new Error(`Failed to get records: ${error.message}`);
  }
}

/**
 * Create a new record
 */
async function createRecord(table, data) {
  try {
    // Check if the table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [table]
    );
    
    if (!tableExists) {
      throw new Error(`Table '${table}' does not exist`);
    }
    
    // Extract fields and values
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = Array(fields.length).fill('?').join(', ');
    
    // Build and execute the query
    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await db.run(query, values);
    
    // Get the inserted record
    const inserted = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [result.lastID]);
    
    return {
      success: true,
      message: 'Record created successfully',
      id: result.lastID,
      record: inserted
    };
  } catch (error) {
    throw new Error(`Failed to create record: ${error.message}`);
  }
}

/**
 * Update an existing record
 */
async function updateRecord(table, id, data) {
  try {
    // Check if the table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [table]
    );
    
    if (!tableExists) {
      throw new Error(`Table '${table}' does not exist`);
    }
    
    // Check if the record exists
    const record = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    
    if (!record) {
      throw new Error(`Record with ID ${id} not found in table '${table}'`);
    }
    
    // Build SET clause and parameters
    const setClause = Object.keys(data).map(field => `${field} = ?`).join(', ');
    const params = [...Object.values(data), id];
    
    // Build and execute the query
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const result = await db.run(query, params);
    
    // Get the updated record
    const updated = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    
    return {
      success: true,
      message: 'Record updated successfully',
      changes: result.changes,
      record: updated
    };
  } catch (error) {
    throw new Error(`Failed to update record: ${error.message}`);
  }
}

/**
 * Delete a record
 */
async function deleteRecord(table, id) {
  try {
    // Check if the table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [table]
    );
    
    if (!tableExists) {
      throw new Error(`Table '${table}' does not exist`);
    }
    
    // Check if the record exists
    const record = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    
    if (!record) {
      throw new Error(`Record with ID ${id} not found in table '${table}'`);
    }
    
    // Execute the delete query
    const result = await db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    
    return {
      success: true,
      message: 'Record deleted successfully',
      changes: result.changes,
      deleted_record: record
    };
  } catch (error) {
    throw new Error(`Failed to delete record: ${error.message}`);
  }
}

/**
 * Get schema information for a table
 */
async function getSchema(table) {
  try {
    // Check if the table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [table]
    );
    
    if (!tableExists) {
      throw new Error(`Table '${table}' does not exist`);
    }
    
    // Get table information
    const tableInfo = await db.all(`PRAGMA table_info(${table})`);
    
    // Get foreign key information
    const foreignKeys = await db.all(`PRAGMA foreign_key_list(${table})`);
    
    // Get index information
    const indices = await db.all(`PRAGMA index_list(${table})`);
    
    // Format the schema information
    const columns = tableInfo.map(col => ({
      name: col.name,
      type: col.type,
      notNull: col.notnull === 1,
      defaultValue: col.dflt_value,
      primaryKey: col.pk === 1
    }));
    
    const formattedForeignKeys = foreignKeys.map(fk => ({
      id: fk.id,
      column: fk.from,
      referencedTable: fk.table,
      referencedColumn: fk.to
    }));
    
    const formattedIndices = indices.map(idx => ({
      name: idx.name,
      unique: idx.unique === 1
    }));
    
    return {
      table,
      columns,
      foreignKeys: formattedForeignKeys,
      indices: formattedIndices
    };
  } catch (error) {
    throw new Error(`Failed to get schema: ${error.message}`);
  }
}

/**
 * Get a list of all tables
 */
async function getTables() {
  try {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    return {
      tables: tables.map(t => t.name)
    };
  } catch (error) {
    throw new Error(`Failed to get tables: ${error.message}`);
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    // Get list of tables
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    // Get row counts for each table
    const tableCounts = await Promise.all(
      tables.map(async (table) => {
        const countResult = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
        return {
          table: table.name,
          count: countResult.count
        };
      })
    );
    
    // Get database file size
    const fileStats = require('fs').statSync(dbFile);
    const fileSizeBytes = fileStats.size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    return {
      tables: tables.length,
      tableCounts,
      totalRecords: tableCounts.reduce((sum, table) => sum + table.count, 0),
      databaseSize: {
        bytes: fileSizeBytes,
        megabytes: fileSizeMB.toFixed(2)
      },
      lastModified: fileStats.mtime
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
}

// Initialize the database before starting the server
initializeDatabase().catch(err => {
  console.error('Database initialization error:', err);
  process.exit(1);
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Validate MCP request format
    if (!requestData || !requestData.tool || !requestData.parameters) {
      return res.status(400).json({
        error: 'Invalid MCP request format'
      });
    }
    
    const { tool: toolName, parameters } = requestData;
    
    // Find the requested tool
    const tool = TOOLS.find(t => t.name === toolName);
    
    if (!tool) {
      return res.status(404).json({
        error: `Tool not found: ${toolName}`
      });
    }
    
    // Validate parameters
    const validationErrors = validateParameters(tool, parameters);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: validationErrors
      });
    }
    
    // Execute the appropriate tool
    let result;
    
    switch (toolName) {
      case 'query_data':
        result = await queryData(
          parameters.query,
          parameters.parameters,
          parameters.limit
        );
        break;
        
      case 'get_records':
        result = await getRecords(
          parameters.table,
          parameters.filters,
          parameters.limit,
          parameters.offset,
          parameters.order_by,
          parameters.order_direction
        );
        break;
        
      case 'create_record':
        result = await createRecord(
          parameters.table,
          parameters.data
        );
        break;
        
      case 'update_record':
        result = await updateRecord(
          parameters.table,
          parameters.id,
          parameters.data
        );
        break;
        
      case 'delete_record':
        result = await deleteRecord(
          parameters.table,
          parameters.id
        );
        break;
        
      case 'get_schema':
        result = await getSchema(
          parameters.table
        );
        break;
        
      case 'get_tables':
        result = await getTables();
        break;
        
      case 'get_database_stats':
        result = await getDatabaseStats();
        break;
        
      default:
        return res.status(500).json({
          error: `Tool implementation missing: ${toolName}`
        });
    }
    
    // Return successful response
    res.json({
      tool: toolName,
      result
    });
  } catch (error) {
    console.error('MCP request error:', error);
    
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// MCP capabilities endpoint
app.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: MCP_PROTOCOL_VERSION,
    tools: TOOLS
  });
});

// Root endpoint for info
app.get('/', (req, res) => {
  res.json({
    name: 'Database Operations MCP Server',
    description: 'An MCP server that provides tools for database operations',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    endpoints: {
      '/': 'This info page',
      '/mcp': 'MCP capabilities (GET) and tool execution (POST)'
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Database Operations MCP Server running on port ${PORT}`);
});