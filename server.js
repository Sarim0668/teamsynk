// server.js - Using http module
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ─── Helper function to call Ollama ──────────────────────────────────────
function callOllama(endpoint, method, body, callback) {
  const options = {
    hostname: 'localhost',
    port: 11434,
    path: endpoint,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        callback(null, jsonData);
      } catch (e) {
        callback(new Error('Invalid JSON response'), null);
      }
    });
  });

  req.on('error', (error) => {
    callback(error, null);
  });

  if (body) {
    req.write(JSON.stringify(body));
  }
  req.end();
}

// ─── Status Check ──────────────────────────────────────────────────────────
app.get('/api/ai/status', async (req, res) => {
  console.log('📡 Status check requested...');
  
  callOllama('/api/tags', 'GET', null, (error, data) => {
    if (error) {
      console.log('❌ Error connecting to Ollama:', error.message);
      res.json({ status: 'offline' });
    } else {
      console.log('✅ Ollama is online');
      res.json({ status: 'online' });
    }
  });
});

// ─── Chat Endpoint ──────────────────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log('📝 Received message:', message);

    const prompt = `User: ${message}\nAI:`;

    const requestBody = {
      model: 'tinyllama',
      prompt: prompt,
      stream: false,
      temperature: 0.5,
      max_tokens: 20,
      num_predict: 20,
      num_ctx: 128,
      stop: ['\n', 'User:', 'AI:']
    };

    callOllama('/api/generate', 'POST', requestBody, (error, data) => {
      if (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      let aiReply = data.response || "Hey! 😊";
      aiReply = aiReply.replace(/^(AI:|Response:|Friend:)/i, '').trim();
      
      if (!aiReply || aiReply.length < 2) {
        const fallbacks = ["That's cool! 😊", "I'm here! 💕", "Tell me more! ✨"];
        aiReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      console.log('🤖 AI Reply:', aiReply);
      res.json({ success: true, response: aiReply });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ AI Server running on http://localhost:${PORT}`);
  console.log(`📍 Status: http://localhost:${PORT}/api/ai/status`);
});