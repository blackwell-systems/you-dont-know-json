const express = require('express');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const app = express();
app.use(express.json());

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const userSchema = {
  type: 'object',
  required: ['username', 'email'],
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-z0-9_]+$'
    },
    email: {
      type: 'string',
      format: 'email'
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150
    }
  },
  additionalProperties: false
};

const validateUser = ajv.compile(userSchema);

function validationMiddleware(schema) {
  const validate = ajv.compile(schema);
  
  return (req, res, next) => {
    if (!validate(req.body)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validate.errors.map(err => ({
          field: err.instancePath.slice(1) || err.params?.missingProperty || 'root',
          message: err.message,
          keyword: err.keyword
        }))
      });
    }
    next();
  };
}

const users = [];

app.post('/api/users', validationMiddleware(userSchema), (req, res) => {
  const newUser = {
    id: users.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.status(201).json(newUser);
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

const updateSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-z0-9_]+$'
    },
    email: {
      type: 'string',
      format: 'email'
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150
    }
  },
  additionalProperties: false
};

app.patch('/api/users/:id', validationMiddleware(updateSchema), (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(users[userIndex]);
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\nEndpoints:');
    console.log('  POST   /api/users     - Create user (requires username, email)');
    console.log('  GET    /api/users     - List all users');
    console.log('  GET    /api/users/:id - Get user by ID');
    console.log('  PATCH  /api/users/:id - Update user');
    console.log('  DELETE /api/users/:id - Delete user');
    console.log('\nTry creating a user:');
    console.log('  curl -X POST http://localhost:3000/api/users \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"username":"alice","email":"alice@example.com","age":30}\'');
    console.log('\nTry invalid data:');
    console.log('  curl -X POST http://localhost:3000/api/users \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"username":"al","email":"not-email"}\'');
  });
}

module.exports = { app, validationMiddleware };
