const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const userSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-z0-9_]+$'
    },
    email: {
      type: 'string',
      format: 'email'
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150
    },
    bio: {
      type: 'string',
      maxLength: 500
    },
    website: {
      type: 'string',
      format: 'uri'
    }
  },
  required: ['username', 'email'],
  additionalProperties: false
};

const validate = ajv.compile(userSchema);

function validateUser(data) {
  const valid = validate(data);
  
  if (valid) {
    return { success: true, data };
  } else {
    return {
      success: false,
      errors: validate.errors.map(err => ({
        field: err.instancePath.slice(1) || err.params?.missingProperty || 'root',
        message: err.message,
        keyword: err.keyword,
        params: err.params
      }))
    };
  }
}

console.log('Testing valid user:');
const validUser = {
  username: 'alice',
  email: 'alice@example.com',
  age: 30,
  bio: 'Software engineer',
  website: 'https://alice.dev'
};
console.log(validateUser(validUser));

console.log('\nTesting invalid user (multiple errors):');
const invalidUser = {
  username: 'al',
  email: 'not-an-email',
  age: 200,
  bio: 'x'.repeat(600),
  extraField: 'not allowed'
};
console.log(JSON.stringify(validateUser(invalidUser), null, 2));

console.log('\nTesting missing required fields:');
const incompleteUser = {
  username: 'bob'
};
console.log(JSON.stringify(validateUser(incompleteUser), null, 2));

module.exports = { validateUser, userSchema };
