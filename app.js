// Must be the first import to ensure env vars are loaded before other imports (ESM hoisting)
import './src/config/env.js';

import express from 'express';
import cors from 'cors';


import connectToDB from './src/config/db.js'
import { errorHandler } from './src/middlewares/index.js';
import { customErrors } from './src/utils/index.js';
import { authRoute, documentRoute, flashcardRoute, aiRoute, quizRoute, dashboardRoute } from './src/routes/index.js';

const { NotFoundError } = customErrors;

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({
  origin: "*",      // DANGEROUS for Prod: Allows ANY website to call your API
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  credentials: true // Allow cookies/headers to be passed back and forth
}));


app.use(express.json());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/documents', documentRoute);
app.use('/api/flashcards', flashcardRoute);
app.use('/api/ai', aiRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/dashboard', dashboardRoute);


// not found route
app.use((req, res, next) => {
  next(new NotFoundError('Route not found'));
})


app.use(errorHandler);


app.listen(PORT, async () => {
  console.log(`Server is up and running on Port: ${PORT}`);
  // once the server is up, then connect to the db
  try {
    await connectToDB();

  } catch (error) {
    console.log('DB connection Error:', error);

    // turn off the web server gracefully
    process.exit(1);
  }
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