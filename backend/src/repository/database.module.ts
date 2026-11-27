import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configProvider } from '../app.config.provider';
import { Film } from '../films/entities/film.entity';
import { Schedule } from '../films/entities/schedule.entity';
import { FilmsRepository } from './films.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { database } = configProvider.useFactory(config);
        const url = new URL(database.url);
        return {
          type: database.driver as 'postgres',
          host: url.hostname,
          port: Number(url.port || 5432),
          database: url.pathname.slice(1),
          username: database.username,
          password: database.password,
          entities: [Film, Schedule],
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([Film, Schedule]),
  ],
  providers: [FilmsRepository],
  exports: [FilmsRepository],
})
export class DatabaseModule {}
