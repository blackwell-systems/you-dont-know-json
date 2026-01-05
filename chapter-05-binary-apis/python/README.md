# Chapter 5: Binary APIs - Python Examples

MessagePack encoding and decoding examples in Python.

## Installation

```bash
pip install msgpack
```

Or with uv:

```bash
uv pip install msgpack
```

## Examples

### 01-messagepack.py

Comprehensive MessagePack demonstration covering:
- Basic encoding/decoding
- Size comparison with JSON
- Type preservation
- Performance benchmarks
- Binary data handling
- Streaming for large datasets
- Special values and edge cases

**Run:**
```bash
python3 01-messagepack.py
```

Or with uv:
```bash
uv run --with msgpack python3 01-messagepack.py
```

## Key Concepts

### MessagePack Benefits
- **Smaller size**: 20-50% smaller than JSON
- **Faster**: 2-4x faster encoding/decoding
- **Binary support**: No base64 encoding needed
- **Type preservation**: Integers, floats, binary, etc.
- **Streaming**: Efficient for large datasets

### Important: raw=False

Always use `raw=False` when unpacking text data:

```python
decoded = msgpack.unpackb(data, raw=False)
```

Without this flag, strings are decoded as bytes objects instead of str.
