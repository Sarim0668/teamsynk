// api/ai/status.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return res.status(200).json({ 
      status: response.ok ? 'online' : 'offline' 
    });
  } catch (error) {
    return res.status(503).json({ status: 'offline' });
  }
}