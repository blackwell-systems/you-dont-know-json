const axios = require('axios');

const JSON_RPC_URL = 'http://localhost:3000/rpc';

class JSONRPCClient {
  constructor(url) {
    this.url = url;
    this.requestId = 0;
  }
  
  async call(method, params) {
    this.requestId++;
    
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId
    };
    
    try {
      const response = await axios.post(this.url, request);
      const data = response.data;
      
      if (data.error) {
        const error = new Error(data.error.message);
        error.code = data.error.code;
        error.data = data.error.data;
        throw error;
      }
      
      return data.result;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP Error: ${error.response.status}`);
      }
      throw error;
    }
  }
  
  async notify(method, params) {
    const request = {
      jsonrpc: '2.0',
      method,
      params
    };
    
    try {
      await axios.post(this.url, request);
    } catch (error) {
      console.error('Notification failed:', error.message);
    }
  }
  
  async batch(calls) {
    const requests = calls.map((call, index) => ({
      jsonrpc: '2.0',
      method: call.method,
      params: call.params,
      id: this.requestId + index + 1
    }));
    
    this.requestId += calls.length;
    
    try {
      const response = await axios.post(this.url, requests);
      const results = response.data;
      
      return results.map(result => {
        if (result.error) {
          const error = new Error(result.error.message);
          error.code = result.error.code;
          return { error };
        }
        return { result: result.result };
      });
    } catch (error) {
      throw new Error(`Batch request failed: ${error.message}`);
    }
  }
}

async function main() {
  const client = new JSONRPCClient(JSON_RPC_URL);
  
  try {
    console.log('1. Simple addition:');
    const sum = await client.call('add', [5, 3]);
    console.log('Result:', sum);
    
    console.log('\n2. Named parameters:');
    const greeting = await client.call('greet', {name: 'Alice', title: 'Dr.'});
    console.log('Result:', greeting);
    
    console.log('\n3. Error handling (division by zero):');
    try {
      await client.call('divide', [10, 0]);
    } catch (error) {
      console.log('Error caught:', error.message, '(code:', error.code + ')');
    }
    
    console.log('\n4. Method not found:');
    try {
      await client.call('nonexistent', []);
    } catch (error) {
      console.log('Error caught:', error.message);
    }
    
    console.log('\n5. Notification (fire-and-forget):');
    await client.notify('logEvent', {level: 'info', message: 'Test event'});
    console.log('Notification sent (no response expected)');
    
    console.log('\n6. Batch request:');
    const batchResults = await client.batch([
      {method: 'add', params: [1, 2]},
      {method: 'multiply', params: [3, 4]},
      {method: 'subtract', params: [10, 3]}
    ]);
    console.log('Batch results:', batchResults);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = JSONRPCClient;
