const fs = require('fs');
const { Transform } = require('stream');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

const userSchema = {
  type: 'object',
  required: ['user_id', 'email', 'created_at'],
  properties: {
    user_id: { type: 'integer' },
    email: { type: 'string', format: 'email' },
    created_at: { type: 'string' },
    location: {
      type: 'object',
      properties: {
        country: { type: 'string' }
      }
    },
    tags: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

class UserTransformer extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.validate = ajv.compile(userSchema);
    this.stats = { valid: 0, invalid: 0, transformed: 0 };
    this.enrichmentCache = new Map();
  }
  
  async _transform(chunk, encoding, callback) {
    try {
      const line = chunk.toString().trim();
      if (!line) {
        return callback();
      }
      
      const record = JSON.parse(line);
      
      if (!this.validate(record)) {
        this.stats.invalid++;
        this.emit('invalid', { 
          record, 
          errors: this.validate.errors,
          line: this.stats.valid + this.stats.invalid 
        });
        return callback();
      }
      
      this.stats.valid++;
      
      const transformed = await this.transformRecord(record);
      this.stats.transformed++;
      
      this.push(JSON.stringify(transformed) + '\n');
      callback();
      
    } catch (error) {
      this.stats.invalid++;
      this.emit('parseError', { 
        error: error.message, 
        line: this.stats.valid + this.stats.invalid 
      });
      callback();
    }
  }
  
  async transformRecord(record) {
    const transformed = {
      id: record.user_id,
      email: record.email.toLowerCase(),
      created: new Date(record.created_at).toISOString(),
      country: record.location?.country || 'unknown',
      tags: record.tags || []
    };
    
    if (transformed.email && !this.enrichmentCache.has(transformed.email)) {
      const enrichment = await this.lookupUserSegment(transformed.email);
      this.enrichmentCache.set(transformed.email, enrichment);
    }
    
    transformed.segment = this.enrichmentCache.get(transformed.email);
    
    return transformed;
  }
  
  async lookupUserSegment(email) {
    const domain = email.split('@')[1];
    
    const enterpriseDomains = ['company.com', 'enterprise.com', 'corp.com'];
    if (enterpriseDomains.some(d => domain.includes(d))) {
      return 'enterprise';
    }
    
    const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
    if (freeDomains.some(d => domain === d)) {
      return 'consumer';
    }
    
    return 'unknown';
  }
  
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.enrichmentCache.size
    };
  }
}

function createSampleInput(filename, recordCount = 1000) {
  const stream = fs.createWriteStream(filename);
  const countries = ['US', 'UK', 'CA', 'DE', 'FR', 'JP'];
  const domains = ['gmail.com', 'yahoo.com', 'company.com', 'corp.com'];
  
  for (let i = 0; i < recordCount; i++) {
    const record = {
      user_id: i + 1,
      email: `user${i}@${domains[i % domains.length]}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      location: {
        country: countries[i % countries.length]
      },
      tags: ['tag1', 'tag2'].slice(0, Math.floor(Math.random() * 3))
    };
    
    stream.write(JSON.stringify(record) + '\n');
  }
  
  stream.write('{"invalid": "missing required fields"}\n');
  stream.write('{broken json\n');
  
  stream.end();
  console.log(`Created ${filename} with ${recordCount} records (plus 2 invalid)`);
}

async function runTransform(inputFile, outputFile, invalidFile) {
  return new Promise((resolve, reject) => {
    const transformer = new UserTransformer();
    const invalidStream = fs.createWriteStream(invalidFile);
    
    transformer.on('invalid', (invalid) => {
      invalidStream.write(JSON.stringify(invalid) + '\n');
      console.error(`Invalid record at line ${invalid.line}:`, invalid.errors[0].message);
    });
    
    transformer.on('parseError', (error) => {
      console.error(`Parse error at line ${error.line}:`, error.error);
    });
    
    const inputStream = fs.createReadStream(inputFile);
    const outputStream = fs.createWriteStream(outputFile);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity
    });
    
    rl.on('line', (line) => {
      transformer.write(line);
    });
    
    rl.on('close', () => {
      transformer.end();
    });
    
    transformer.pipe(outputStream);
    
    outputStream.on('finish', () => {
      invalidStream.end();
      const stats = transformer.getStats();
      console.log('\n=== Transform Complete ===');
      console.log(`Valid records:       ${stats.valid}`);
      console.log(`Invalid records:     ${stats.invalid}`);
      console.log(`Transformed records: ${stats.transformed}`);
      console.log(`Cache size:          ${stats.cacheSize}`);
      resolve(stats);
    });
    
    outputStream.on('error', reject);
  });
}

async function main() {
  const inputFile = 'input_users.jsonl';
  const outputFile = 'transformed_users.jsonl';
  const invalidFile = 'invalid_users.jsonl';
  
  console.log('Creating sample input file...\n');
  createSampleInput(inputFile, 1000);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('\nTransforming data...');
  await runTransform(inputFile, outputFile, invalidFile);
  
  console.log('\n=== Sample Transformed Records ===');
  const readline = require('readline');
  const rl = readline.createInterface({
    input: fs.createReadStream(outputFile),
    crlfDelay: Infinity
  });
  
  let count = 0;
  for await (const line of rl) {
    if (count < 3) {
      console.log(JSON.parse(line));
      count++;
    } else {
      break;
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { UserTransformer, userSchema };
