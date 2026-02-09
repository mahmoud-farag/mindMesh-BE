import mongoose  from 'mongoose';


const connectToDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000,
    }); 

    console.log(`DB connection established client: ${connection.connection.host}`);

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB Cluster');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Mongoose connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      try {
        await mongoose.connection.close(false); // Force close false by default
        console.log('Mongoose disconnected through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during Mongoose disconnection', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    return connection;
  } catch(error) {
    console.log('Error while connecting to the DB client', error);
    // Explicitly exit if initial connection fails, as the app cannot function without DB
    process.exit(1); 
  }
}

export default connectToDB;


