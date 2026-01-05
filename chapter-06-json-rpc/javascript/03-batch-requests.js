const express = require('express');

const app = express();
app.use(express.json());

const users = [
  { id: 1, username: 'alice', email: 'alice@example.com', active: true },
  { id: 2, username: 'bob', email: 'bob@example.com', active: true },
  { id: 3, username: 'charlie', email: 'charlie@example.com', active: false }
];

const methods = {
  getUser: (id) => {
    const user = users.find(u => u.id === id);
    if (!user) {
      const error = new Error('User not found');
      error.code = -32001;
      throw error;
    }
    return user;
  },
  
  updateUser: ({ id, updates }) => {
    const user = users.find(u => u.id === id);
    if (!user) {
      const error = new Error('User not found');
      error.code = -32001;
      throw error;
    }
    Object.assign(user, updates);
    return user;
  },
  
  listUsers: ({ active } = {}) => {
    if (active === undefined) {
      return users;
    }
    return users.filter(u => u.active === active);
  },
  
  deleteUser: (id) => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      const error = new Error('User not found');
      error.code = -32001;
      throw error;
    }
    users.splice(index, 1);
    return { success: true };
  }
};

app.post('/rpc', async (req, res) => {
  const request = req.body;
  
  if (Array.isArray(request)) {
    if (request.length === 0) {
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: empty batch' },
        id: null
      });
    }
    
    console.log(`Processing batch of ${request.length} requests`);
    const responses = await Promise.all(
      request.map(req => handleSingleRequest(req))
    );
    
    const filtered = responses.filter(resp => resp !== null);
    
    if (filtered.length === 0) {
      return res.status(204).end();
    }
    
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
  if (!request || typeof request !== 'object') {
    return {
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id: null
    };
  }
  
  const { jsonrpc, method, params, id } = request;
  
  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      id: id || null
    };
  }
  
  if (id === undefined) {
    if (methods[method]) {
      try {
        await methods[method](params);
      } catch (err) {
      }
    }
    return null;
  }
  
  if (!methods[method]) {
    return {
      jsonrpc: '2.0',
      error: { code: -32601, message: 'Method not found' },
      id
    };
  }
  
  try {
    const result = await methods[method](params);
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

async function sendBatchRequest(requests) {
  const response = await fetch('http://localhost:3000/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requests)
  });
  
  if (response.status === 204) {
    console.log('All notifications (no responses expected)');
    return [];
  }
  
  return response.json();
}

function printResponse(responses) {
  if (!Array.isArray(responses)) {
    responses = [responses];
  }
  
  responses.forEach((resp, index) => {
    console.log(`\n[${index + 1}] Request ID: ${resp.id}`);
    if (resp.error) {
      console.log(`   ✗ Error: ${resp.error.message} (code: ${resp.error.code})`);
    } else {
      console.log(`   ✓ Result:`, JSON.stringify(resp.result, null, 2));
    }
  });
}

if (require.main === module) {
  const PORT = 3000;
  const server = app.listen(PORT, async () => {
    console.log(`JSON-RPC Batch Server listening on http://localhost:${PORT}/rpc\n`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('=== Example 1: Basic Batch Request ===');
    const batch1 = [
      { jsonrpc: '2.0', method: 'getUser', params: 1, id: 1 },
      { jsonrpc: '2.0', method: 'getUser', params: 2, id: 2 },
      { jsonrpc: '2.0', method: 'listUsers', params: { active: true }, id: 3 }
    ];
    console.log('Sending:', JSON.stringify(batch1, null, 2));
    const response1 = await sendBatchRequest(batch1);
    printResponse(response1);
    
    console.log('\n\n=== Example 2: Mixed Success and Errors ===');
    const batch2 = [
      { jsonrpc: '2.0', method: 'getUser', params: 1, id: 10 },
      { jsonrpc: '2.0', method: 'getUser', params: 999, id: 11 },
      { jsonrpc: '2.0', method: 'invalidMethod', params: {}, id: 12 }
    ];
    console.log('Sending:', JSON.stringify(batch2, null, 2));
    const response2 = await sendBatchRequest(batch2);
    printResponse(response2);
    
    console.log('\n\n=== Example 3: Notifications (No IDs) ===');
    const batch3 = [
      { jsonrpc: '2.0', method: 'updateUser', params: { id: 1, updates: { email: 'newalice@example.com' } } },
      { jsonrpc: '2.0', method: 'updateUser', params: { id: 2, updates: { active: false } } }
    ];
    console.log('Sending notifications (no responses expected):', JSON.stringify(batch3, null, 2));
    const response3 = await sendBatchRequest(batch3);
    console.log('Responses:', response3.length === 0 ? 'None (as expected)' : response3);
    
    console.log('\n\n=== Example 4: Mixed Requests and Notifications ===');
    const batch4 = [
      { jsonrpc: '2.0', method: 'getUser', params: 1, id: 20 },
      { jsonrpc: '2.0', method: 'updateUser', params: { id: 3, updates: { active: true } } },
      { jsonrpc: '2.0', method: 'listUsers', params: {}, id: 21 }
    ];
    console.log('Sending mixed batch:', JSON.stringify(batch4, null, 2));
    const response4 = await sendBatchRequest(batch4);
    console.log('\nResponses (only for requests with IDs):');
    printResponse(response4);
    
    console.log('\n\n=== Example 5: Large Batch (Performance Test) ===');
    const largeBatch = Array.from({ length: 100 }, (_, i) => ({
      jsonrpc: '2.0',
      method: 'getUser',
      params: (i % 3) + 1,
      id: 100 + i
    }));
    console.log(`Sending ${largeBatch.length} requests...`);
    const start = Date.now();
    const response5 = await sendBatchRequest(largeBatch);
    const duration = Date.now() - start;
    console.log(`✓ Received ${response5.length} responses in ${duration}ms`);
    console.log(`  Average: ${(duration / response5.length).toFixed(2)}ms per request`);
    
    console.log('\n\n=== Batch Request Best Practices ===');
    console.log('1. Use batching for multiple independent operations');
    console.log('2. Mix notifications (no id) for fire-and-forget operations');
    console.log('3. Server processes batch requests in parallel');
    console.log('4. Response order may differ from request order');
    console.log('5. Empty batches are invalid per JSON-RPC 2.0 spec');
    console.log('6. Batch of all notifications returns 204 No Content');
    
    server.close();
    process.exit(0);
  });
}

module.exports = { app, methods };
