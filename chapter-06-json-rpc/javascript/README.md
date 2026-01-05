# Chapter 6: JSON-RPC - JavaScript Examples

Complete JSON-RPC 2.0 server and client implementation.

## Setup

```bash
npm install
```

## Running the Examples

### Start the Server

```bash
npm run server
```

Server starts on `http://localhost:3000/rpc`

### Run the Client (in separate terminal)

```bash
npm run client
```

## What's Included

### 01-server.js

Complete JSON-RPC 2.0 server with:
- Standard error codes (-32700 through -32603)
- Batch request support
- Notification handling (fire-and-forget)
- Positional and named parameters
- Error handling with custom error codes
- Async method support

**Available methods:**
- `add(a, b)` - Addition
- `subtract(a, b)` - Subtraction
- `multiply(a, b)` - Multiplication
- `divide(a, b)` - Division (throws error on division by zero)
- `greet({name, title})` - Named parameters example
- `getUser(userId)` - Async method returning user object

### 02-client.js

JSON-RPC client with:
- Simple method calls
- Error handling
- Notification support
- Batch requests
- Reusable class for multiple calls

## Testing Manually

### Single Request
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"add","params":[5,3],"id":1}'
```

### Named Parameters
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"greet","params":{"name":"Alice","title":"Dr."},"id":2}'
```

### Batch Request
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '[
    {"jsonrpc":"2.0","method":"add","params":[1,2],"id":"1"},
    {"jsonrpc":"2.0","method":"multiply","params":[3,4],"id":"2"}
  ]'
```

### Notification (no response)
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"logEvent","params":{"level":"info","message":"Test"}}'
```

## Error Handling

The server returns standard JSON-RPC errors:
- `-32700` - Parse error
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error
- `-32000 to -32099` - Server errors (custom)

## Book Reference

These examples correspond to Chapter 6, "JSON-RPC: Structured Remote Procedure Calls" - specifically the "Implementing a JSON-RPC Server" section (pages ~155-180 in PDF).

Referenced in book introduction as available in companion repository.
