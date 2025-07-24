import 'reflect-metadata';
import { AppDataSource, closeDatabase } from '../config/database';

// Set test environment before any imports
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  // Clean up database before each test by dropping and recreating schema
  if (AppDataSource.isInitialized) {
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize();
  }
});