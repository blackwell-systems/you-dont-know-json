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
    }
  },
  required: ['username', 'email'],
  additionalProperties: false
};

const validate = ajv.compile(userSchema);

function validateUser(data) {
  const isValid = validate(data);
  
  if (isValid) {
    return { success: true, data };
  } else {
    return {
      success: false,
      errors: validate.errors
    };
  }
}

console.log('=== Valid User ===');
const validUser = {
  username: 'alice',
  email: 'alice@example.com',
  age: 30
};
console.log('Input:', JSON.stringify(validUser, null, 2));
const validResult = validateUser(validUser);
console.log('Result:', validResult);

console.log('\n=== Invalid: Missing Required Field ===');
const missingEmail = {
  username: 'bob',
  age: 25
};
console.log('Input:', JSON.stringify(missingEmail, null, 2));
const missingResult = validateUser(missingEmail);
console.log('Result:', JSON.stringify(missingResult, null, 2));

console.log('\n=== Invalid: Format Violation ===');
const badEmail = {
  username: 'carol',
  email: 'not-an-email',
  age: 28
};
console.log('Input:', JSON.stringify(badEmail, null, 2));
const badEmailResult = validateUser(badEmail);
console.log('Result:', JSON.stringify(badEmailResult, null, 2));

console.log('\n=== Invalid: Pattern Violation ===');
const badUsername = {
  username: 'Alice!',
  email: 'alice@example.com'
};
console.log('Input:', JSON.stringify(badUsername, null, 2));
const badUsernameResult = validateUser(badUsername);
console.log('Result:', JSON.stringify(badUsernameResult, null, 2));

console.log('\n=== Invalid: Range Violation ===');
const badAge = {
  username: 'dave',
  email: 'dave@example.com',
  age: 200
};
console.log('Input:', JSON.stringify(badAge, null, 2));
const badAgeResult = validateUser(badAge);
console.log('Result:', JSON.stringify(badAgeResult, null, 2));

console.log('\n=== Invalid: Additional Properties ===');
const extraProps = {
  username: 'eve',
  email: 'eve@example.com',
  age: 35,
  admin: true
};
console.log('Input:', JSON.stringify(extraProps, null, 2));
const extraPropsResult = validateUser(extraProps);
console.log('Result:', JSON.stringify(extraPropsResult, null, 2));

module.exports = { validateUser, userSchema };
