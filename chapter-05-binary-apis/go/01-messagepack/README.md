# MessagePack with Go

MessagePack encoding example using github.com/vmihailenco/msgpack/v5 library.

## Setup

```bash
go mod download
```

## Running

```bash
go run main.go
```

## What It Demonstrates

- MessagePack encoding/decoding with struct tags
- Size comparison (MessagePack vs JSON)
- Performance benchmarking (10,000 iterations)
- Type preservation across serialization
- Special value handling (nil, empty arrays, zeros)

## Expected Output

```
=== Original Data ===
{
  "id": 123,
  "username": "alice",
  "tags": ["golang", "rust", "json"],
  "active": true,
  "balance": 1234.56
}

=== Size Comparison ===
JSON size:        85 bytes
MessagePack size: 52 bytes
Compression:      38.8% smaller

=== Performance Test ===
JSON encoding:        45ms
MessagePack encoding: 18ms
MessagePack is 2.5x faster
```

## Book Reference

Chapter 5, lines 160-200: Go MessagePack implementation demonstrating binary format performance advantages.
