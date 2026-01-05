# Chapter 13: Testing JSON Systems - Go Benchmarks

Go benchmark suite comparing JSON serialization performance across different implementations and payload sizes.

## Benchmarks Included

### Standard Library vs Alternatives

- **encoding/json** (stdlib) - Prioritizes correctness and stability
- **goccy/go-json** - Performance-focused drop-in replacement (2-3x faster)
- **msgpack** - Binary format comparison (smaller size, faster serialization)

### Benchmark Categories

1. **Marshal (serialization)** - Convert structs to bytes
2. **Unmarshal (deserialization)** - Convert bytes to structs
3. **Memory allocations** - Track heap allocations with `-benchmem`
4. **Parallel execution** - Test concurrent performance
5. **Payload sizes** - Compare small (10 records) vs large (10,000 records)

## Setup

```bash
# Download dependencies
go mod download

# Verify setup
go test -v
```

## Running Benchmarks

### Run all benchmarks
```bash
go test -bench=. -benchmem
```

### Run specific library benchmarks
```bash
# Standard library only
go test -bench=StdJSON -benchmem

# goccy/go-json only
go test -bench=GoccyJSON -benchmem

# MessagePack only
go test -bench=MsgPack -benchmem
```

### Compare marshal vs unmarshal
```bash
# Marshal benchmarks
go test -bench=Marshal -benchmem

# Unmarshal benchmarks
go test -bench=Unmarshal -benchmem
```

### Test memory allocations
```bash
go test -bench=Memory -benchmem
```

### Run parallel benchmarks
```bash
go test -bench=Parallel -benchmem
```

### Compare payload sizes
```bash
# Small payloads (10 records)
go test -bench=Small -benchmem

# Large payloads (10,000 records)
go test -bench=Large -benchmem
```

## Understanding Results

### Benchmark Output Format

```
BenchmarkStdJSONMarshal-8    1000    1052847 ns/op   245760 B/op    2001 allocs/op
```

Breaking down the columns:
- `BenchmarkStdJSONMarshal-8` - Test name with GOMAXPROCS value (8 cores)
- `1000` - Number of iterations run
- `1052847 ns/op` - Nanoseconds per operation (1.05ms)
- `245760 B/op` - Bytes allocated per operation (240 KB)
- `2001 allocs/op` - Number of allocations per operation

### Expected Performance Characteristics

From Chapter 13 example results (1000 user records):

| Implementation | Marshal (ns/op) | Memory (B/op) | Allocs | Relative Speed |
|----------------|-----------------|---------------|--------|----------------|
| encoding/json  | ~1,053,000      | ~246,000      | 2,001  | 1.0x (baseline) |
| goccy/go-json  | ~524,000        | ~123,000      | 1,001  | 2.0x faster     |
| MessagePack    | ~351,000        | ~82,000       | 501    | 3.0x faster     |

**Key observations:**
- goccy/go-json is roughly 2x faster than stdlib
- MessagePack is 3x faster and uses 1/3 the memory
- Allocations follow a similar pattern (fewer allocs = better performance)

### When Performance Differences Matter

**stdlib JSON is fine when:**
- Payload size < 10 KB
- Request rate < 100/sec
- Latency budget > 10ms
- Standard library maintenance is priority

**Consider alternatives when:**
- Processing 1000+ req/sec
- Payload size > 100 KB
- Latency budget < 5ms
- Reducing cloud costs (CPU/memory)

## Size Comparison Test

Run the non-benchmark test to see serialization size differences:

```bash
go test -v -run=TestSerializationSizes
```

Expected output:
```
Serialization sizes for 1000 users:
  Standard JSON:    180000 bytes
  goccy/go-json:    180000 bytes (same)
  MessagePack:      120000 bytes

Size ratios (vs standard JSON):
  goccy/go-json:    100.0%
  MessagePack:      66.7%
```

**Key insight:** goccy/go-json produces identical output to stdlib (it's a drop-in replacement), but MessagePack uses ~33% less space due to binary encoding.

## Customizing Benchmarks

### Adjust User Count

Edit `generateTestUsers` calls in benchmark functions:
```go
users := generateTestUsers(100)   // Small
users := generateTestUsers(1000)  // Medium (default)
users := generateTestUsers(10000) // Large
```

### Add Custom User Fields

Modify the `User` struct to match your domain:
```go
type User struct {
    ID          string            `json:"id"`
    Name        string            `json:"name"`
    Email       string            `json:"email"`
    // Add your fields here
    CustomField string            `json:"custom_field"`
}
```

### Benchmark Run Time

Control how long benchmarks run:
```bash
# Run for at least 3 seconds per benchmark
go test -bench=. -benchtime=3s

# Run exactly 1000 iterations
go test -bench=. -benchtime=1000x
```

## Book Reference

From Chapter 13, lines 2267-2409: Benchmark testing section demonstrating Go's built-in performance testing capabilities for JSON serialization.

## Key Insights from Go Benchmarking

**Why Go's benchmark framework is excellent:**
- Built into `go test` - zero setup
- Automatically determines iteration count for statistical significance
- `-benchmem` flag tracks allocations precisely
- Parallel benchmarks test concurrent performance
- Results are reproducible and comparable across runs

**Trade-offs in serialization libraries:**
- **stdlib json**: Correctness and stability over raw speed. Used in production by Google for 10+ years.
- **goccy/go-json**: Drop-in replacement optimized for speed. Uses unsafe operations for performance.
- **MessagePack**: Binary format trades human-readability for smaller size and faster parsing.

**When measurements matter:**
- JSON parsing is often NOT the bottleneck (database queries, network I/O usually dominate)
- Measure in production context before optimizing
- A 2x speedup in parsing 1ms of 100ms request = 1% improvement
- But at high scale (millions req/sec), even 1% matters

## Related Examples

- Property-based testing (Example 13.2) - Generate test data automatically
- Load testing with k6 (Chapter 13 section 5) - Full system performance
- Database performance (Chapter 13 lines 2411+) - PostgreSQL JSON benchmarks
