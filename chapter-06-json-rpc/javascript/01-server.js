const express = require('express');
const app = express();

app.use(express.json());

const methods = {
  add: (a, b) => a + b,
  
  subtract: (a, b) => a - b,
  
  multiply: (a, b) => a * b,
  
  divide: (a, b) => {
    if (b === 0) {
      const error = new Error('Division by zero');
      error.code = -32000;
      throw error;
    }
    return a / b;
  },
  
  greet: ({name, title}) => {
    return `Hello, ${title} ${name}!`;
  },
  
  getUser: async (userId) => {
    if (userId === 123) {
      return {
        id: 123,
        username: 'alice',
        email: 'alice@example.com'
      };
    }
    const error = new Error('User not found');
    error.code = -32003;
    throw error;
  }
};

app.post('/rpc', async (req, res) => {
  const request = req.body;
  
  if (!request.jsonrpc || request.jsonrpc !== '2.0') {
    return res.json({
      jsonrpc: '2.0',
      error: {code: -32600, message: 'Invalid Request'},
      id: request.id || null
    });
  }
  
  if (Array.isArray(request)) {
    const responses = await Promise.all(
      request.map(req => handleSingleRequest(req))
    );
    const filtered = responses.filter(resp => resp !== null);
    return res.json(filtered);
  }
  
  const response = await handleSingleRequest(request);
  if (response) {
    res.json(response);
  } else {
    res.status(204).end();
  }
});

async function handleSingleRequest(request) {
  const {method, params, id} = request;
  
  if (id === undefined) {
    if (methods[method]) {
      try {
        await methods[method](...(Array.isArray(params) ? params : [params]));
      } catch (err) {
      }
    }
    return null;
  }
  
  if (!methods[method]) {
    return {
      jsonrpc: '2.0',
      error: {code: -32601, message: 'Method not found'},
      id
    };
  }
  
  try {
    let args;
    if (Array.isArray(params)) {
      args = params;
    } else if (typeof params === 'object') {
      args = [params];
    } else {
      args = [];
    }
    
    const result = await methods[method](...args);
    
    return {
      jsonrpc: '2.0',
      result,
      id
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      error: {
        code: error.code || -32603,
        message: error.message
      },
      id
    };
  }
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`JSON-RPC server listening on http://localhost:${PORT}/rpc`);
  console.log('\nExample requests:');
  console.log('curl -X POST http://localhost:3000/rpc -H "Content-Type: application/json" -d \'{"jsonrpc":"2.0","method":"add","params":[5,3],"id":1}\'');
});
