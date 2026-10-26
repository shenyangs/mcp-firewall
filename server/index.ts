import express from 'express';
const app = express(); app.use(express.json({limit:'512kb'}));
app.get('/api/health', (_req,res) => res.json({ ok: true, project: 'mcp-firewall' }));
app.listen(5205, '127.0.0.1', () => console.log('[mcp-firewall] api ready on 5205'));
