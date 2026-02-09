// Must be the first import to ensure env vars are loaded before other imports (ESM hoisting)
import './src/config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


import connectToDB from './src/config/db.js'
import { errorHandler } from './src/middlewares/index.js';
import { customErrors } from './src/utils/index.js';
import { authRoute, documentRoute, flashcardRoute, aiRoute, quizRoute, dashboardRoute } from './src/routes/index.js';

const { NotFoundError } = customErrors;

const app = express();
const PORT = process.env.PORT ?? 4000;


app.use(cors({
  origin: ['http://localhost:5173', 'https://mindmeshf.vercel.app'],
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  credentials: true 
}));
 

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit only 100 req every 10 mins, after that an error will be sent to the user
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Apply the rate limiting middleware to all requests
app.use('/api', limiter);



app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/documents', documentRoute);
app.use('/api/flashcards', flashcardRoute);
app.use('/api/ai', aiRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/dashboard', dashboardRoute);

app.use('/', (req, res) => {
  res.status(200).json({ success: true, message: 'MindMesh Backend is running successfully!' });
})

// not found route
app.use((req, res, next) => {
  next(new NotFoundError('Route not found'));
})


app.use(errorHandler);


// Connect to DB before starting server
try {
  await connectToDB();
} catch (error) {
  console.log('DB connection Error:', error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server is up and running on Port: ${PORT}`);
});




process.on('unhandledRejection', (error) => {

  console.error('UNHANDLED REJECTION!  Shutting down...');
  console.error(error);
  process.exit(1);

})


process.on('uncaughtException', (error) => {

  console.error('UNCAUGHT EXCEPTION!  Shutting down...');
  console.error(error);
  process.exit(1);

})