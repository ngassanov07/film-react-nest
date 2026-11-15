import mongoose from 'mongoose';
import { AppConfig } from '../app.config.provider';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export const databaseProvider = {
  provide: DATABASE_CONNECTION,
  inject: ['CONFIG'],
  useFactory: (config: AppConfig) =>
    mongoose.createConnection(config.database.url).asPromise(),
};
