import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.MONGODB_DB_NAME || 'next-auth-app';
const MAX_POOL = Number(process.env.MONGODB_MAX_POOL_SIZE || 10);
const MIN_POOL = Number(process.env.MONGODB_MIN_POOL_SIZE || 0);
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000);
const SOCKET_TIMEOUT_MS = Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000);

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in environment');
}

// Cache the connection across hot reloads in development
declare global {
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

let cached = global.mongooseConn;
if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      maxPoolSize: MAX_POOL,
      minPoolSize: MIN_POOL,
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
