# Chapter 13: Testing JSON Systems - JavaScript Examples

Examples demonstrating comprehensive testing strategies for JSON systems, including property-based testing with fast-check and JSON Schema validation.

## Examples

### 02-property-testing.js
Property-based testing for JSON Schema validation using fast-check. Demonstrates:
- Automatic test case generation (1000+ test cases per property)
- Schema validation invariants
- Boundary testing for numeric constraints
- Format validation for email addresses
- Round-trip serialization testing
- Deep nesting and special character handling

**Key concepts:**
- Properties define invariants that should always hold
- Generators create random test data within constraints
- Fast-check explores edge cases automatically
- Failures provide minimal reproducing examples

## Setup

```bash
npm install
```

## Running Examples

Run all tests:
```bash
npm test
```

Run property-based tests only:
```bash
npm run test:property
```

## What This Demonstrates

### Property-Based Testing Benefits

**Traditional testing:**
```javascript
test('user with valid age passes validation', () => {
  const user = { email: 'test@example.com', age: 25 };
  expect(validate(user)).toBe(true);
});
```

**Property-based testing:**
```javascript
test('all valid ages pass validation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 18, max: 120 }),
      (age) => {
        const user = { email: 'test@example.com', age };
        expect(validate(user)).toBe(true);
      }
    ),
    { numRuns: 1000 }
  );
});
```

The property-based approach tests 1000 different ages automatically, discovering edge cases like boundary values (18, 120) and typical failures (17, 121).

### Coverage vs Manual Tests

**Manual approach:** Write 5-10 test cases, miss edge cases
**Property-based:** Generate 1000 test cases, explore boundaries automatically

### Integration with JSON Schema

Property-based testing complements JSON Schema perfectly:
- Schema defines valid data structure
- Generators create data matching schema constraints
- Properties verify schema validation works correctly
- Round-trip tests ensure serialization preserves data

## Book Reference

From Chapter 13, lines 165-244: Property-Based Testing section demonstrating fast-check integration with Ajv schema validation.

## Key Insights

1. **Properties > Examples**: Instead of "age 25 is valid", express "all ages 18-120 are valid"
2. **Automatic Edge Cases**: Framework finds boundary values, empty arrays, special characters
3. **Shrinking**: When tests fail, fast-check provides minimal failing example
4. **Schema as Spec**: JSON Schema defines valid structure, properties verify implementation

## Related Patterns

- Schema-based test data generation (Example 13.1)
- Contract testing with Pact (Example 13.3+)
- Fuzzing for edge cases (Chapter 13 section 6)
- API testing strategies (Chapter 13 section 3)
