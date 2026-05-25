// Placeholder - init-db not used in production
// This file exists for backward compatibility only
// Database initialization is handled by /api/setup endpoint

export function initializeDatabase(): boolean {
  throw new Error('SQLite initialization should not be used in production')
}

