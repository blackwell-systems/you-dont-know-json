const msgpack = require('msgpack5')();

const testData = {
  id: 123,
  username: 'alice',
  tags: ['golang', 'rust', 'json'],
  active: true,
  balance: 1234.56,
  metadata: {
    created: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
};

console.log('=== Original Data ===');
console.log(JSON.stringify(testData, null, 2));

console.log('\n=== MessagePack Encoding ===');
const encoded = msgpack.encode(testData);
console.log('Encoded bytes:', encoded.length);
console.log('Hex representation:', encoded.toString('hex').substring(0, 60) + '...');

console.log('\n=== MessagePack Decoding ===');
const decoded = msgpack.decode(encoded);
console.log(JSON.stringify(decoded, null, 2));

console.log('\n=== Size Comparison ===');
const jsonString = JSON.stringify(testData);
const jsonBytes = Buffer.byteLength(jsonString, 'utf8');
console.log(`JSON size:        ${jsonBytes} bytes`);
console.log(`MessagePack size: ${encoded.length} bytes`);
console.log(`Compression:      ${((1 - encoded.length / jsonBytes) * 100).toFixed(1)}% smaller`);

console.log('\n=== Round-trip Verification ===');
const roundTripEncoded = msgpack.encode(decoded);
const roundTripDecoded = msgpack.decode(roundTripEncoded);
console.log('Data preserved:', JSON.stringify(testData) === JSON.stringify(roundTripDecoded));

console.log('\n=== Type Preservation ===');
console.log(`Original ID type: ${typeof testData.id} (${testData.id})`);
console.log(`Decoded ID type:  ${typeof decoded.id} (${decoded.id})`);
console.log(`Original balance type: ${typeof testData.balance} (${testData.balance})`);
console.log(`Decoded balance type:  ${typeof decoded.balance} (${decoded.balance})`);
console.log(`Original active type: ${typeof testData.active} (${testData.active})`);
console.log(`Decoded active type:  ${typeof decoded.active} (${decoded.active})`);

console.log('\n=== Performance Test ===');
const iterations = 10000;
const largeData = {
  users: Array(100).fill().map((_, i) => ({
    id: i,
    username: `user_${i}`,
    email: `user${i}@example.com`,
    active: i % 2 === 0,
    score: Math.random() * 1000
  }))
};

console.log(`Encoding ${iterations} times...`);
const jsonStartEncode = Date.now();
for (let i = 0; i < iterations; i++) {
  JSON.stringify(largeData);
}
const jsonEncodeTime = Date.now() - jsonStartEncode;

const msgpackStartEncode = Date.now();
for (let i = 0; i < iterations; i++) {
  msgpack.encode(largeData);
}
const msgpackEncodeTime = Date.now() - msgpackStartEncode;

console.log(`JSON encoding:        ${jsonEncodeTime}ms`);
console.log(`MessagePack encoding: ${msgpackEncodeTime}ms`);
console.log(`MessagePack is ${(jsonEncodeTime / msgpackEncodeTime).toFixed(1)}x faster`);

console.log(`\nDecoding ${iterations} times...`);
const jsonEncoded = JSON.stringify(largeData);
const msgpackEncoded = msgpack.encode(largeData);

const jsonStartDecode = Date.now();
for (let i = 0; i < iterations; i++) {
  JSON.parse(jsonEncoded);
}
const jsonDecodeTime = Date.now() - jsonStartDecode;

const msgpackStartDecode = Date.now();
for (let i = 0; i < iterations; i++) {
  msgpack.decode(msgpackEncoded);
}
const msgpackDecodeTime = Date.now() - msgpackStartDecode;

console.log(`JSON decoding:        ${jsonDecodeTime}ms`);
console.log(`MessagePack decoding: ${msgpackDecodeTime}ms`);
console.log(`MessagePack is ${(jsonDecodeTime / msgpackDecodeTime).toFixed(1)}x faster`);

console.log('\n=== Special Values ===');
const specialValues = {
  nullValue: null,
  undefinedValue: undefined,
  emptyString: '',
  emptyArray: [],
  emptyObject: {},
  largeNumber: 9007199254740991,
  negativeNumber: -42,
  float: 3.14159
};

const specialEncoded = msgpack.encode(specialValues);
const specialDecoded = msgpack.decode(specialEncoded);
console.log('Original:', JSON.stringify(specialValues, null, 2));
console.log('Decoded:', JSON.stringify(specialDecoded, null, 2));

module.exports = { msgpack, testData };
