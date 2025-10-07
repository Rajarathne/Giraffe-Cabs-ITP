// Centralized runtime configuration.
// IMPORTANT: Never hardcode secrets here. Use environment variables instead.

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  PORT: process.env.PORT || 5000,
  // Prefer env var; fall back to local Mongo only for developer machines
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/giraffe-cabs',
  JWT_SECRET: process.env.JWT_SECRET,
};

if (isProduction) {
  if (!config.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI. Set it in environment for production.');
  }
  if (!config.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET. Set it in environment for production.');
  }
}

module.exports = config;






































































