const fs = require('fs');
const readline = require('readline');
const { Transform } = require('stream');

class LogProcessor extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.errorCount = 0;
    this.processedCount = 0;
    this.filters = options.filters || {};
  }
  
  _transform(line, encoding, callback) {
    if (!line.trim()) {
      return callback();
    }
    
    try {
      const log = JSON.parse(line);
      
      if (this.shouldProcess(log)) {
        this.processedCount++;
        this.push(log);
      }
      
      callback();
    } catch (err) {
      this.errorCount++;
      this.emit('parseError', {
        line: this.processedCount + this.errorCount,
        error: err.message,
        content: line.substring(0, 100)
      });
      callback();
    }
  }
  
  shouldProcess(log) {
    if (this.filters.level && log.level !== this.filters.level) {
      return false;
    }
    
    if (this.filters.minTimestamp) {
      const logTime = new Date(log.timestamp);
      if (logTime < this.filters.minTimestamp) {
        return false;
      }
    }
    
    return true;
  }
}

class LogAnalyzer {
  constructor() {
    this.stats = {
      total: 0,
      byLevel: {},
      byUser: {},
      errors: []
    };
  }
  
  process(log) {
    this.stats.total++;
    
    this.stats.byLevel[log.level] = (this.stats.byLevel[log.level] || 0) + 1;
    
    if (log.userId) {
      this.stats.byUser[log.userId] = (this.stats.byUser[log.userId] || 0) + 1;
    }
    
    if (log.level === 'error') {
      this.stats.errors.push({
        timestamp: log.timestamp,
        message: log.message,
        userId: log.userId
      });
    }
  }
  
  getReport() {
    return {
      summary: {
        total: this.stats.total,
        errorCount: this.stats.errors.length,
        errorRate: (this.stats.errors.length / this.stats.total * 100).toFixed(2) + '%'
      },
      byLevel: this.stats.byLevel,
      topUsers: Object.entries(this.stats.byUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count })),
      recentErrors: this.stats.errors.slice(-5)
    };
  }
}

async function processLogPipeline(filename, options = {}) {
  return new Promise((resolve, reject) => {
    const processor = new LogProcessor(options);
    const analyzer = new LogAnalyzer();
    
    processor.on('parseError', (error) => {
      console.error(`Parse error on line ${error.line}: ${error.error}`);
    });
    
    processor.on('data', (log) => {
      analyzer.process(log);
    });
    
    processor.on('end', () => {
      resolve(analyzer.getReport());
    });
    
    processor.on('error', reject);
    
    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    rl.on('line', (line) => processor.write(line));
    rl.on('close', () => processor.end());
  });
}

function createSampleLogs(filename, count = 10000) {
  const stream = fs.createWriteStream(filename);
  const levels = ['info', 'warn', 'error', 'debug'];
  
  for (let i = 0; i < count; i++) {
    const log = {
      id: i + 1,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: `Log message ${i + 1}`,
      userId: Math.floor(Math.random() * 100),
      duration: Math.random() * 1000,
      endpoint: ['/api/users', '/api/orders', '/api/products'][Math.floor(Math.random() * 3)]
    };
    
    stream.write(JSON.stringify(log) + '\n');
  }
  
  stream.write('{broken json\n');
  
  stream.end();
  console.log(`Created ${filename} with ${count} log entries (plus 1 malformed)`);
}

async function main() {
  const filename = 'sample-logs.jsonl';
  
  console.log('Creating sample log file...\n');
  createSampleLogs(filename, 10000);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('Processing all logs...');
  const allLogsReport = await processLogPipeline(filename);
  console.log(JSON.stringify(allLogsReport, null, 2));
  
  console.log('\n\nFiltering for errors only...');
  const errorReport = await processLogPipeline(filename, { 
    filters: { level: 'error' } 
  });
  console.log(JSON.stringify(errorReport, null, 2));
  
  console.log('\n\nFiltering for recent logs (last hour)...');
  const recentReport = await processLogPipeline(filename, {
    filters: { minTimestamp: new Date(Date.now() - 3600000) }
  });
  console.log(`Recent logs: ${recentReport.summary.total} records`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processLogPipeline, LogProcessor, LogAnalyzer };
