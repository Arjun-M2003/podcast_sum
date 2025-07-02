require('dotenv').config(); // Loads .env variables
import express from 'express';
// import your routes here
import uploadRoutes from './routes/upload';

const app = express();
app.use(express.json());

app.use('/api/upload', uploadRoutes);
// app.use('/api/summarize', summarizeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});