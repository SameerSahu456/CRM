import express from 'express';
import cors from 'cors';
import handler from './api/index.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Handle all /api routes using middleware
app.use('/api', (req, res) => {
  handler(req, res);
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
