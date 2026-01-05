const fs = require('fs');
const readline = require('readline');

async function processJSONL(filename) {
  const fileStream = fs.createReadStream(filename);
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let count = 0;
  let errors = 0;
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const obj = JSON.parse(line);
      
      if (obj.level === 'error') {
        console.log('Error log:', obj.message);
      }
      
      count++;
    } catch (err) {
      errors++;
      console.error(`Parse error on line ${count + 1}:`, err.message);
      console.error('  Line content:', line.substring(0, 100));
    }
  }
  
  console.log(`\nProcessed ${count} records with ${errors} errors`);
  return { count, errors };
}

function createSampleFile(filename, recordCount = 1000) {
  const writeStream = fs.createWriteStream(filename);
  
  for (let i = 0; i < recordCount; i++) {
    const record = {
      id: i + 1,
      timestamp: new Date().toISOString(),
      level: i % 10 === 0 ? 'error' : 'info',
      message: `Log message ${i + 1}`,
      userId: Math.floor(Math.random() * 1000),
      duration: Math.random() * 1000
    };
    
    writeStream.write(JSON.stringify(record) + '\n');
  }
  
  writeStream.end();
  console.log(`Created ${filename} with ${recordCount} records`);
}

async function main() {
  const filename = 'sample-logs.jsonl';
  
  console.log('Creating sample JSON Lines file...');
  createSampleFile(filename, 1000);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('\nProcessing JSON Lines file...');
  await processJSONL(filename);
  
  console.log('\nTesting error recovery with malformed line...');
  fs.appendFileSync(filename, '{broken json\n');
  await processJSONL(filename);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processJSONL, createSampleFile };
