import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the Vite build directory
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// All other routes should serve index.html (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});

export default app;
