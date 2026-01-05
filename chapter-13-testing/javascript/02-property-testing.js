const fc = require('fast-check');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const userSchema = {
  type: 'object',
  required: ['email', 'age'],
  properties: {
    email: {
      type: 'string',
      format: 'email'
    },
    age: {
      type: 'integer',
      minimum: 18,
      maximum: 120
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 50
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
      maxItems: 10
    },
    preferences: {
      type: 'object',
      properties: {
        newsletter: { type: 'boolean' },
        theme: { enum: ['light', 'dark', 'auto'] }
      }
    }
  },
  additionalProperties: false
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(userSchema);

describe('User Schema Property-Based Tests', () => {
  test('all generated valid users should pass validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          age: fc.integer({ min: 18, max: 120 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          tags: fc.array(fc.string(), { maxLength: 10 }),
          preferences: fc.record({
            newsletter: fc.boolean(),
            theme: fc.oneof(
              fc.constant('light'),
              fc.constant('dark'),
              fc.constant('auto')
            )
          })
        }),
        (user) => {
          expect(validate(user)).toBe(true);
          expect(user.email).toContain('@');
          expect(user.age).toBeGreaterThanOrEqual(18);
          expect(user.age).toBeLessThanOrEqual(120);
          expect(user.tags.length).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('invalid data should fail validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.string(),
          age: fc.oneof(fc.string(), fc.float())
        }),
        (invalidUser) => {
          const isValid = validate(invalidUser);
          
          expect(isValid).toBe(false);
          expect(validate.errors).toBeTruthy();
        }
      ),
      { numRuns: 500 }
    );
  });

  test('round-trip serialization preserves data', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          age: fc.integer({ min: 18, max: 120 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          tags: fc.array(fc.string(), { maxLength: 10 }),
          preferences: fc.record({
            newsletter: fc.boolean(),
            theme: fc.constantFrom('light', 'dark', 'auto')
          })
        }),
        (user) => {
          const serialized = JSON.stringify(user);
          const deserialized = JSON.parse(serialized);
          
          expect(deserialized).toEqual(user);
          expect(validate(deserialized)).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('age boundaries are enforced', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        (age) => {
          const user = {
            email: 'test@example.com',
            age: age
          };
          
          const isValid = validate(user);
          
          if (age >= 18 && age <= 120) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
            expect(validate.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  instancePath: '/age'
                })
              ])
            );
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('email format is validated', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (emailCandidate) => {
          const user = {
            email: emailCandidate,
            age: 25
          };
          
          const isValid = validate(user);
          
          if (emailCandidate.includes('@')) {
            const parts = emailCandidate.split('@');
            if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
              return;
            }
          }
          
          if (!emailCandidate.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            expect(isValid).toBe(false);
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  test('additional properties are rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.anything(),
        (extraKey, extraValue) => {
          const user = {
            email: 'test@example.com',
            age: 25,
            [extraKey]: extraValue
          };
          
          if (extraKey === 'email' || extraKey === 'age' || 
              extraKey === 'name' || extraKey === 'tags' || 
              extraKey === 'preferences') {
            return;
          }
          
          const isValid = validate(user);
          expect(isValid).toBe(false);
          expect(validate.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                keyword: 'additionalProperties'
              })
            ])
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('tags array length is bounded', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
        (tags) => {
          const user = {
            email: 'test@example.com',
            age: 25,
            tags: tags
          };
          
          const isValid = validate(user);
          
          if (tags.length <= 10) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
            expect(validate.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  instancePath: '/tags',
                  keyword: 'maxItems'
                })
              ])
            );
          }
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('JSON Parsing Property Tests', () => {
  test('valid JSON round-trips correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          string: fc.string(),
          number: fc.integer(),
          boolean: fc.boolean(),
          null: fc.constant(null),
          array: fc.array(fc.integer(), { maxLength: 10 }),
          object: fc.record({
            nested: fc.string()
          })
        }),
        (data) => {
          const serialized = JSON.stringify(data);
          const parsed = JSON.parse(serialized);
          
          expect(parsed).toEqual(data);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('deeply nested objects serialize correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.string(),
        (depth, value) => {
          let nested = value;
          for (let i = 0; i < depth; i++) {
            nested = { [`level${i}`]: nested };
          }
          
          const serialized = JSON.stringify(nested);
          const parsed = JSON.parse(serialized);
          
          expect(parsed).toEqual(nested);
          
          let current = parsed;
          for (let i = 0; i < depth; i++) {
            expect(current).toHaveProperty(`level${i}`);
            current = current[`level${i}`];
          }
          expect(current).toBe(value);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('special characters in strings are escaped', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str) => {
          const obj = { text: str };
          const serialized = JSON.stringify(obj);
          const parsed = JSON.parse(serialized);
          
          expect(parsed.text).toBe(str);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

if (require.main === module) {
  console.log('Run tests with: npm test');
  console.log('\nExample property-based tests:');
  console.log('- Generate 1000 valid users and verify all pass validation');
  console.log('- Generate random ages and verify boundary enforcement');
  console.log('- Generate random emails and verify format validation');
  console.log('- Test round-trip serialization with random data');
}

module.exports = { userSchema, validate };
