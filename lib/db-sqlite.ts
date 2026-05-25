// Placeholder - SQLite not used in production
// This file exists for backward compatibility only
// Use Aurora PostgreSQL instead

export function getDatabase() {
  throw new Error('SQLite module should not be used in production')
}

