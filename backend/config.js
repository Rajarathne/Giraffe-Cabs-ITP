// Centralized runtime configuration.
// IMPORTANT: Never hardcode secrets here. Use environment variables instead.

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  PORT: process.env.PORT || 5000,
  // Require explicit Mongo URI from environment; do NOT fall back to localhost
  MONGODB_URI: process.env.MONGODB_URI,
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

// In all environments, fail fast if Mongo URI is not provided
if (!config.MONGODB_URI) {
  console.error('\u274c MONGODB_URI is not set. Create backend/.env with:');
  console.error('MONGODB_URI=mongodb+srv://Rahal:SnFMkQRFMaeHzbqj@cluster0.wrmom9e.mongodb.net/giraffe-cabs?retryWrites=true&w=majority');
  process.exit(1);
}

module.exports = config;



































































