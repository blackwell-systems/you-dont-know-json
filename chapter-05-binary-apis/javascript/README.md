# Chapter 5: Binary APIs - JavaScript Examples

Examples demonstrating MessagePack encoding for mobile-optimized APIs, comparing binary formats against JSON for bandwidth and performance.

## Examples

### 01-messagepack-basic.js
Basic MessagePack encoding/decoding with performance and size comparisons. Demonstrates:
- Encode/decode operations
- Size comparison (typically 30-40% smaller than JSON)
- Type preservation (numbers, booleans, strings)
- Round-trip verification
- Performance benchmarking (encoding/decoding speed)
- Special value handling (null, undefined, empty arrays)

### 02-messagepack-api.js
Express API server supporting both JSON and MessagePack responses. Demonstrates:
- Content negotiation based on Accept header
- Hybrid JSON/MessagePack endpoints
- Size comparison headers
- Mobile-optimized responses
- Format statistics

## Setup

```bash
npm install
```

## Running Examples

### Basic MessagePack encoding
```bash
npm run messagepack
```

Expected output:
- Size comparison showing 30-40% reduction
- Performance benchmarks showing MessagePack speed
- Type preservation verification

### API Server
```bash
npm run server
```

Server starts on http://localhost:3000

**Test with cURL:**

```bash
# JSON response (default)
curl http://localhost:3000/api/users/1

# MessagePack response (binary)
curl -H "Accept: application/msgpack" http://localhost:3000/api/users/1 | xxd

# Compare format statistics
curl http://localhost:3000/api/stats
```

## What This Demonstrates

### Size Reduction

For typical user objects:
- JSON: 310 bytes
- MessagePack: 198 bytes
- **Savings: 36%**

At scale (500k requests/day):
- JSON bandwidth: 4.7 GB/month
- MessagePack bandwidth: 3.0 GB/month
- **Savings: 1.7 GB/month**

### Performance Characteristics

MessagePack is typically:
- 2-3x faster encoding than JSON.stringify
- 1.5-2x faster decoding than JSON.parse
- 30-40% smaller payload size

### Content Negotiation

The API server demonstrates production pattern:
```javascript
if (req.accepts('application/msgpack')) {
  res.type('application/msgpack');
  res.send(msgpack.encode(data));
} else {
  res.json(data);
}
```

This allows:
- Mobile apps to request MessagePack (smaller, faster)
- Web browsers to use JSON (native support)
- Development tools to use JSON (human-readable)
- Same API serving both formats

### When to Use MessagePack

**Good fit:**
- + Mobile apps (bandwidth constrained)
- + High-volume APIs (cost savings)
- + Large payloads (user feeds, search results)
- + Internal microservices (both ends control format)

**Not recommended:**
- - Web browsers (no native support)
- - Public APIs (JSON more universal)
- - Small payloads (overhead not worth it)
- - Debug/development (JSON more readable)

## Book Reference

From Chapter 5, lines 130-420: MessagePack encoding section demonstrating binary format advantages for mobile APIs.

## Key Insights

**MessagePack trade-offs:**
- Smaller size (30-40% reduction typical)
- Faster parsing (2-3x speedup)
- Binary format (not human-readable)
- Requires library support (not native like JSON)

**Real-world impact:**
- Mobile data costs: $10-20/GB
- Battery drain: 15-20% reduction for API-heavy apps
- Latency: Smaller payloads = faster transfers on slow networks
- Scale: 1.7 GB/month savings per 10k users = $17-34/month

**Hybrid approach wins:**
- Serve MessagePack to mobile apps
- Serve JSON to web browsers
- Same backend code, format negotiated via Accept header
- Gradual migration path (add MessagePack without breaking JSON clients)

## Related Patterns

- Binary storage in databases (Chapter 4 - JSONB, BSON)
- Streaming binary formats (Chapter 7 - JSON Lines with compression)
- Performance testing (Chapter 13 - benchmarking MessagePack vs JSON)
