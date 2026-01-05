#!/usr/bin/env python3

import msgpack
import json
import time
from datetime import datetime

test_data = {
    'id': 123,
    'username': 'alice',
    'tags': ['golang', 'rust', 'json'],
    'active': True,
    'balance': 1234.56,
    'metadata': {
        'created': datetime.now().isoformat(),
        'lastLogin': datetime.now().isoformat()
    }
}

print('=== Original Data ===')
print(json.dumps(test_data, indent=2))

print('\n=== MessagePack Encoding ===')
encoded = msgpack.packb(test_data)
print(f'Encoded bytes: {len(encoded)}')
print(f'Hex representation: {encoded[:30].hex()}...')

print('\n=== MessagePack Decoding ===')
decoded = msgpack.unpackb(encoded, raw=False)
print(json.dumps(decoded, indent=2))

print('\n=== Size Comparison ===')
json_string = json.dumps(test_data)
json_bytes = len(json_string.encode('utf-8'))
print(f'JSON size:        {json_bytes} bytes')
print(f'MessagePack size: {len(encoded)} bytes')
print(f'Compression:      {((1 - len(encoded) / json_bytes) * 100):.1f}% smaller')

print('\n=== Round-trip Verification ===')
round_trip_encoded = msgpack.packb(decoded)
round_trip_decoded = msgpack.unpackb(round_trip_encoded, raw=False)
print(f'Data preserved: {json.dumps(test_data, sort_keys=True) == json.dumps(round_trip_decoded, sort_keys=True)}')

print('\n=== Type Preservation ===')
print(f'Original ID type: {type(test_data["id"]).__name__} ({test_data["id"]})')
print(f'Decoded ID type:  {type(decoded["id"]).__name__} ({decoded["id"]})')
print(f'Original balance type: {type(test_data["balance"]).__name__} ({test_data["balance"]})')
print(f'Decoded balance type:  {type(decoded["balance"]).__name__} ({decoded["balance"]})')
print(f'Original active type: {type(test_data["active"]).__name__} ({test_data["active"]})')
print(f'Decoded active type:  {type(decoded["active"]).__name__} ({decoded["active"]})')

print('\n=== Performance Test ===')
iterations = 10000
large_data = {
    'users': [
        {
            'id': i,
            'username': f'user_{i}',
            'email': f'user{i}@example.com',
            'active': i % 2 == 0,
            'score': i * 3.14
        }
        for i in range(100)
    ]
}

print(f'Encoding {iterations} times...')
json_start_encode = time.time()
for _ in range(iterations):
    json.dumps(large_data)
json_encode_time = (time.time() - json_start_encode) * 1000

msgpack_start_encode = time.time()
for _ in range(iterations):
    msgpack.packb(large_data)
msgpack_encode_time = (time.time() - msgpack_start_encode) * 1000

print(f'JSON encoding:        {json_encode_time:.0f}ms')
print(f'MessagePack encoding: {msgpack_encode_time:.0f}ms')
print(f'MessagePack is {json_encode_time / msgpack_encode_time:.1f}x faster')

print(f'\nDecoding {iterations} times...')
json_encoded = json.dumps(large_data)
msgpack_encoded = msgpack.packb(large_data)

json_start_decode = time.time()
for _ in range(iterations):
    json.loads(json_encoded)
json_decode_time = (time.time() - json_start_decode) * 1000

msgpack_start_decode = time.time()
for _ in range(iterations):
    msgpack.unpackb(msgpack_encoded, raw=False)
msgpack_decode_time = (time.time() - msgpack_start_decode) * 1000

print(f'JSON decoding:        {json_decode_time:.0f}ms')
print(f'MessagePack decoding: {msgpack_decode_time:.0f}ms')
print(f'MessagePack is {json_decode_time / msgpack_decode_time:.1f}x faster')

print('\n=== Special Values ===')
special_values = {
    'nullValue': None,
    'emptyString': '',
    'emptyArray': [],
    'emptyDict': {},
    'largeNumber': 9007199254740991,
    'negativeNumber': -42,
    'float': 3.14159
}

special_encoded = msgpack.packb(special_values)
special_decoded = msgpack.unpackb(special_encoded, raw=False)
print('Original:', json.dumps(special_values, indent=2))
print('Decoded:', json.dumps(special_decoded, indent=2))

print('\n=== Binary Data Handling ===')
binary_data = {
    'filename': 'photo.jpg',
    'data': b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR',
    'size': 1024
}

binary_encoded = msgpack.packb(binary_data)
binary_decoded = msgpack.unpackb(binary_encoded, raw=False)
print(f'Original binary: {binary_data["data"][:10]}')
print(f'Decoded binary:  {binary_decoded["data"][:10]}')
print(f'Binary preserved: {binary_data["data"] == binary_decoded["data"]}')

print('\n=== Timestamp Extension ===')
timestamp_data = {
    'event': 'user_login',
    'timestamp': datetime.now()
}

try:
    timestamp_encoded = msgpack.packb(timestamp_data, datetime=True)
    timestamp_decoded = msgpack.unpackb(timestamp_encoded, timestamp=3, raw=False)
    print(f'Original timestamp: {timestamp_data["timestamp"]}')
    print(f'Decoded timestamp:  {timestamp_decoded["timestamp"]}')
    print(f'Timestamp type: {type(timestamp_decoded["timestamp"]).__name__}')
except Exception as e:
    print(f'Timestamp encoding note: {e}')
    print('Note: Datetime objects require msgpack extensions')

print('\n=== Streaming with Large Data ===')
stream_data = [
    {'id': i, 'value': f'item_{i}'}
    for i in range(1000)
]

packer = msgpack.Packer()
packed_stream = b''.join(packer.pack(item) for item in stream_data)
print(f'Packed {len(stream_data)} items into {len(packed_stream)} bytes')

unpacker = msgpack.Unpacker(raw=False)
unpacker.feed(packed_stream)
unpacked_items = list(unpacker)
print(f'Unpacked {len(unpacked_items)} items')
print(f'First item: {unpacked_items[0]}')
print(f'Last item: {unpacked_items[-1]}')

print('\n=== Use Raw=False for Strings ===')
text_data = {'message': 'Hello, World!'}

encoded_raw_true = msgpack.packb(text_data)
decoded_raw_true = msgpack.unpackb(encoded_raw_true, raw=True)
decoded_raw_false = msgpack.unpackb(encoded_raw_true, raw=False)

print(f'raw=True returns bytes:  {decoded_raw_true}')
print(f'raw=False returns str:   {decoded_raw_false}')
print('Recommendation: Always use raw=False for text data')

print('\n=== MessagePack Benefits ===')
print('1. Smaller payload size (typically 20-50% smaller than JSON)')
print('2. Faster encoding/decoding (2-4x faster than JSON)')
print('3. Binary data support (no base64 encoding needed)')
print('4. Type preservation (integers, floats, binary, etc.)')
print('5. Streaming support for large datasets')
print('6. Cross-language compatibility')
