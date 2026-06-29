import mongoose from 'mongoose';

const connectDB = async () => {
  mongoose.connection.on('connected', () => console.log('[EVENT] MongoDB Connected'));
  mongoose.connection.on('error', (err) => console.error(`[EVENT] MongoDB Error: ${err.message}`));
  mongoose.connection.on('disconnected', () => console.log('[EVENT] MongoDB Disconnected'));

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('[ERROR] MONGODB_URI is not defined in environment variables');
      throw new Error('MONGODB_URI is required');
    }

    const maskedUri = uri.replace(/\/\/.*@/, '//****:****@');
    console.log(`[INFO] Attempting to connect to MongoDB: ${maskedUri}`);

    mongoose.set('bufferCommands', false);

    // Enhanced connection options for Railway/Cloud deployments
    const options = {
      serverSelectionTimeoutMS: 30000,    // 30 seconds (increased from 10s)
      connectTimeoutMS: 30000,            // 30 seconds for initial connection
      socketTimeoutMS: 45000,             // 45 seconds for socket inactivity
      family: 4,                          // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(uri, options);
    console.log(`[SUCCESS] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[INFO] Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[ERROR] MongoDB Connection Failed: ${error.message}`);

    // Provide helpful diagnostic information
    if (error.message.includes('ENOTFOUND')) {
      console.error('[DIAGNOSTIC] DNS lookup failed - check cluster URL');
    } else if (error.message.includes('Authentication failed')) {
      console.error('[DIAGNOSTIC] Authentication failed - check username/password');
    } else if (error.message.includes('Could not connect to any servers')) {
      console.error('[DIAGNOSTIC] Cannot reach MongoDB servers');
      console.error('[SOLUTION] Check MongoDB Atlas Network Access (IP Whitelist)');
      console.error('[SOLUTION] Add 0.0.0.0/0 to IP whitelist or Railway IP ranges');
    } else if (error.message.includes('timed out')) {
      console.error('[DIAGNOSTIC] Connection timed out');
      console.error('[SOLUTION] Check network connectivity and firewall settings');
    }

    throw error;
  }
};

export default connectDB;
