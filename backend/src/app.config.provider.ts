import { ConfigService } from '@nestjs/config';

export const configProvider = {
  provide: 'CONFIG',
  inject: [ConfigService],
  useFactory: (config: ConfigService): AppConfig => ({
    port: Number(config.get<string>('PORT', '3000')),
    database: {
      driver: config.get<string>('DATABASE_DRIVER', 'postgres'),
      url: config.getOrThrow<string>('DATABASE_URL'),
      username: config.getOrThrow<string>('DATABASE_USERNAME'),
      password: config.getOrThrow<string>('DATABASE_PASSWORD'),
    },
  }),
};

export interface AppConfig {
  port: number;
  database: AppConfigDatabase;
}

export interface AppConfigDatabase {
  driver: string;
  url: string;
  username: string;
  password: string;
}
