const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const userSchemaV1 = {
  $id: 'https://example.com/schemas/user/v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    username: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' }
  },
  required: ['id', 'username', 'email'],
  additionalProperties: false
};

const userSchemaV2 = {
  $id: 'https://example.com/schemas/user/v2',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    username: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' },
    displayName: { type: 'string' },
    avatarUrl: { type: 'string', format: 'uri' }
  },
  required: ['id', 'username', 'email'],
  additionalProperties: false
};

const userSchemaV3 = {
  $id: 'https://example.com/schemas/user/v3',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    username: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' },
    displayName: { type: 'string' },
    profile: {
      type: 'object',
      properties: {
        avatarUrl: { type: 'string', format: 'uri' },
        bio: { type: 'string', maxLength: 500 },
        location: { type: 'string' }
      }
    },
    preferences: {
      type: 'object',
      properties: {
        emailNotifications: { type: 'boolean', default: true },
        theme: { type: 'string', enum: ['light', 'dark', 'auto'], default: 'auto' }
      }
    }
  },
  required: ['id', 'username', 'email'],
  additionalProperties: false
};

const validateV1 = ajv.compile(userSchemaV1);
const validateV2 = ajv.compile(userSchemaV2);
const validateV3 = ajv.compile(userSchemaV3);

function migrateV1toV2(userV1) {
  return {
    ...userV1,
    displayName: userV1.username
  };
}

function migrateV2toV3(userV2) {
  const v3 = {
    id: userV2.id,
    username: userV2.username,
    email: userV2.email,
    displayName: userV2.displayName || userV2.username
  };
  
  if (userV2.avatarUrl) {
    v3.profile = {
      avatarUrl: userV2.avatarUrl
    };
  }
  
  return v3;
}

function migrateV3toV2(userV3) {
  const v2 = {
    id: userV3.id,
    username: userV3.username,
    email: userV3.email,
    displayName: userV3.displayName || userV3.username
  };
  
  if (userV3.profile?.avatarUrl) {
    v2.avatarUrl = userV3.profile.avatarUrl;
  }
  
  return v2;
}

function detectSchemaVersion(user) {
  if (user.profile || user.preferences) return 3;
  if (user.displayName || user.avatarUrl) return 2;
  return 1;
}

console.log('=== Schema Evolution Example ===\n');

console.log('--- V1 Schema (Original) ---');
const userV1 = {
  id: 123,
  username: 'alice',
  email: 'alice@example.com'
};
console.log('V1 User:', JSON.stringify(userV1, null, 2));
console.log('Valid against V1:', validateV1(userV1) ? '✓' : '✗');
console.log('Valid against V2:', validateV2(userV1) ? '✓' : '✗');
console.log('Valid against V3:', validateV3(userV1) ? '✓' : '✗');

console.log('\n--- V2 Schema (Backward Compatible) ---');
console.log('Added optional fields: displayName, avatarUrl');
const userV2 = {
  id: 456,
  username: 'bob',
  email: 'bob@example.com',
  displayName: 'Bob Smith',
  avatarUrl: 'https://example.com/avatars/bob.jpg'
};
console.log('V2 User:', JSON.stringify(userV2, null, 2));
console.log('Valid against V1:', validateV1(userV2) ? '✓' : '✗ (has extra fields)');
console.log('Valid against V2:', validateV2(userV2) ? '✓' : '✗');
console.log('Valid against V3:', validateV3(userV2) ? '✓' : '✗');

console.log('\n--- V3 Schema (Breaking Change) ---');
console.log('Restructured: avatarUrl moved into profile object');
const userV3 = {
  id: 789,
  username: 'charlie',
  email: 'charlie@example.com',
  displayName: 'Charlie Brown',
  profile: {
    avatarUrl: 'https://example.com/avatars/charlie.jpg',
    bio: 'Software engineer and JSON enthusiast',
    location: 'San Francisco'
  },
  preferences: {
    emailNotifications: false,
    theme: 'dark'
  }
};
console.log('V3 User:', JSON.stringify(userV3, null, 2));
console.log('Valid against V1:', validateV1(userV3) ? '✓' : '✗ (has extra fields)');
console.log('Valid against V2:', validateV2(userV3) ? '✓' : '✗ (has extra fields)');
console.log('Valid against V3:', validateV3(userV3) ? '✓' : '✗');

console.log('\n--- Backward Compatibility (V1 → V2) ---');
const migratedV1toV2 = migrateV1toV2(userV1);
console.log('Original V1:', JSON.stringify(userV1, null, 2));
console.log('Migrated to V2:', JSON.stringify(migratedV1toV2, null, 2));
console.log('Valid against V2:', validateV2(migratedV1toV2) ? '✓' : '✗');

console.log('\n--- Forward Migration (V2 → V3) ---');
const migratedV2toV3 = migrateV2toV3(userV2);
console.log('Original V2:', JSON.stringify(userV2, null, 2));
console.log('Migrated to V3:', JSON.stringify(migratedV2toV3, null, 2));
console.log('Valid against V3:', validateV3(migratedV2toV3) ? '✓' : '✗');

console.log('\n--- Backward Migration (V3 → V2) ---');
const migratedV3toV2 = migrateV3toV2(userV3);
console.log('Original V3:', JSON.stringify(userV3, null, 2));
console.log('Migrated to V2:', JSON.stringify(migratedV3toV2, null, 2));
console.log('Valid against V2:', validateV2(migratedV3toV2) ? '✓' : '✗');
console.log('Note: Some data lost in downgrade (bio, location, preferences)');

console.log('\n--- Version Detection ---');
const testUsers = [userV1, userV2, userV3];
testUsers.forEach((user, index) => {
  const detectedVersion = detectSchemaVersion(user);
  console.log(`User ${index + 1}: Detected version ${detectedVersion}`);
});

console.log('\n=== Best Practices for Schema Evolution ===');

console.log('\n1. BACKWARD COMPATIBLE CHANGES (Safe):');
console.log('   ✓ Adding optional fields');
console.log('   ✓ Removing required constraints');
console.log('   ✓ Widening field types (string → any)');
console.log('   ✓ Adding enum values');

console.log('\n2. BREAKING CHANGES (Require versioning):');
console.log('   ✗ Removing fields');
console.log('   ✗ Adding required fields');
console.log('   ✗ Changing field types');
console.log('   ✗ Restructuring nested objects');
console.log('   ✗ Removing enum values');

console.log('\n3. VERSIONING STRATEGIES:');
console.log('   • URL versioning: /api/v1/users vs /api/v2/users');
console.log('   • Header versioning: Accept: application/vnd.api+json;version=2');
console.log('   • Schema $id versioning: https://example.com/schemas/user/v3');
console.log('   • Content negotiation: Accept: application/json; version=2');

console.log('\n4. MIGRATION PATTERNS:');
console.log('   • Dual-write: Write to both old and new schemas');
console.log('   • Read-repair: Migrate on read, lazy migration');
console.log('   • Batch migration: Scheduled background jobs');
console.log('   • Adapter layer: Translate between versions at API boundary');

console.log('\n5. DEPRECATION PROCESS:');
console.log('   1. Announce deprecation with timeline');
console.log('   2. Add deprecation warnings to API responses');
console.log('   3. Monitor usage of old version');
console.log('   4. Provide migration guide and tools');
console.log('   5. Remove old version after grace period');

console.log('\n=== Real-World Example: API Version Negotiation ===');

function getSchemaVersion(acceptHeader) {
  const match = acceptHeader.match(/version=(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function transformResponse(user, targetVersion) {
  const currentVersion = detectSchemaVersion(user);
  
  if (currentVersion === targetVersion) {
    return user;
  }
  
  if (currentVersion === 3 && targetVersion === 2) {
    return migrateV3toV2(user);
  }
  
  if (currentVersion === 2 && targetVersion === 3) {
    return migrateV2toV3(user);
  }
  
  if (currentVersion === 1 && targetVersion === 2) {
    return migrateV1toV2(user);
  }
  
  if (currentVersion === 1 && targetVersion === 3) {
    return migrateV2toV3(migrateV1toV2(user));
  }
  
  return user;
}

const acceptHeaderV2 = 'application/json; version=2';
const acceptHeaderV3 = 'application/json; version=3';

console.log('\nClient requests V2 format:');
const requestedVersion = getSchemaVersion(acceptHeaderV2);
console.log(`Requested version: ${requestedVersion}`);
const responseV2 = transformResponse(userV3, requestedVersion);
console.log('Response:', JSON.stringify(responseV2, null, 2));
console.log('Valid against V2:', validateV2(responseV2) ? '✓' : '✗');

console.log('\n--- Summary ---');
console.log('Schema evolution requires careful planning:');
console.log('• Maintain backward compatibility when possible');
console.log('• Version breaking changes explicitly');
console.log('• Provide migration paths between versions');
console.log('• Support multiple versions during transition');
console.log('• Monitor and deprecate old versions gracefully');

module.exports = {
  userSchemaV1,
  userSchemaV2,
  userSchemaV3,
  migrateV1toV2,
  migrateV2toV3,
  migrateV3toV2,
  detectSchemaVersion,
  transformResponse
};
