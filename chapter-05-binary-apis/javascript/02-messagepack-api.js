const express = require('express');
const msgpack = require('msgpack5')();

const app = express();
const PORT = 3000;

app.use(express.json());

const users = [
  { id: 1, username: 'alice', email: 'alice@example.com', active: true, score: 1250 },
  { id: 2, username: 'bob', email: 'bob@example.com', active: true, score: 890 },
  { id: 3, username: 'carol', email: 'carol@example.com', active: false, score: 2100 }
];

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (req.accepts('application/msgpack')) {
    const encoded = msgpack.encode(user);
    const jsonSize = Buffer.byteLength(JSON.stringify(user), 'utf8');
    
    res.type('application/msgpack');
    res.setHeader('X-Content-Size-JSON', jsonSize);
    res.setHeader('X-Content-Size-Msgpack', encoded.length);
    res.setHeader('X-Compression-Ratio', `${((1 - encoded.length / jsonSize) * 100).toFixed(1)}%`);
    res.send(encoded);
  } else {
    res.json(user);
  }
});

app.get('/api/users', (req, res) => {
  if (req.accepts('application/msgpack')) {
    const encoded = msgpack.encode(users);
    const jsonSize = Buffer.byteLength(JSON.stringify(users), 'utf8');
    
    res.type('application/msgpack');
    res.setHeader('X-Content-Size-JSON', jsonSize);
    res.setHeader('X-Content-Size-Msgpack', encoded.length);
    res.setHeader('X-Compression-Ratio', `${((1 - encoded.length / jsonSize) * 100).toFixed(1)}%`);
    res.send(encoded);
  } else {
    res.json(users);
  }
});

app.post('/api/users', (req, res) => {
  let userData;
  
  if (req.is('application/msgpack')) {
    const buffer = req.body;
    userData = msgpack.decode(buffer);
  } else {
    userData = req.body;
  }
  
  const newUser = {
    id: users.length + 1,
    ...userData,
    active: true
  };
  
  users.push(newUser);
  
  if (req.accepts('application/msgpack')) {
    res.type('application/msgpack');
    res.status(201).send(msgpack.encode(newUser));
  } else {
    res.status(201).json(newUser);
  }
});

app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.active).length,
    averageScore: users.reduce((sum, u) => sum + u.score, 0) / users.length
  };
  
  const jsonString = JSON.stringify(stats);
  const jsonSize = Buffer.byteLength(jsonString, 'utf8');
  const msgpackEncoded = msgpack.encode(stats);
  
  res.json({
    stats,
    comparison: {
      json: {
        size: jsonSize,
        format: 'text'
      },
      msgpack: {
        size: msgpackEncoded.length,
        format: 'binary',
        savings: `${((1 - msgpackEncoded.length / jsonSize) * 100).toFixed(1)}%`
      }
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MessagePack API server running on http://localhost:${PORT}`);
    console.log('\nEndpoints:');
    console.log('  GET  /api/users     - List all users');
    console.log('  GET  /api/users/:id - Get user by ID');
    console.log('  POST /api/users     - Create new user');
    console.log('  GET  /api/stats     - Format comparison stats');
    console.log('\nTry with MessagePack:');
    console.log('  curl -H "Accept: application/msgpack" http://localhost:3000/api/users/1 | xxd');
    console.log('\nTry with JSON:');
    console.log('  curl -H "Accept: application/json" http://localhost:3000/api/users/1');
    console.log('\nCompare stats:');
    console.log('  curl http://localhost:3000/api/stats');
  });
}

module.exports = app;
