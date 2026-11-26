import { Inject, Injectable } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { FilmDto, ScheduleDto } from '../films/dto/films.dto';
import { DATABASE_CONNECTION } from './database.provider';
import { FilmSchema } from './films.schema';

@Injectable()
export class FilmsRepository {
  private readonly films: Model<FilmDto>;

  constructor(@Inject(DATABASE_CONNECTION) connection: Connection) {
    this.films = connection.model<FilmDto>('Film', FilmSchema, 'films');
  }

  private toScheduleDto(entity: ScheduleDto): ScheduleDto {
    return {
      id: entity.id,
      daytime: entity.daytime,
      hall: entity.hall,
      rows: entity.rows,
      seats: entity.seats,
      price: entity.price,
      taken: [...(entity.taken ?? [])],
    };
  }

  private toFilmDto(entity: FilmDto): FilmDto {
    return {
      id: entity.id,
      rating: entity.rating,
      director: entity.director,
      tags: [...(entity.tags ?? [])],
      title: entity.title,
      about: entity.about,
      description: entity.description,
      image: entity.image,
      cover: entity.cover,
      schedule: (entity.schedule ?? []).map((s) => this.toScheduleDto(s)),
    };
  }

  async findAll(): Promise<FilmDto[]> {
    const films = await this.films.find().lean<FilmDto[]>().exec();
    return films.map((film) => this.toFilmDto(film));
  }

  async findById(id: string): Promise<FilmDto | null> {
    const film = await this.films.findOne({ id }).lean<FilmDto>().exec();
    return film ? this.toFilmDto(film) : null;
  }

  async takeSeats(
    filmId: string,
    sessionId: string,
    seats: string[],
  ): Promise<boolean> {
    const result = await this.films
      .updateOne(
        {
          id: filmId,
          schedule: { $elemMatch: { id: sessionId, taken: { $nin: seats } } },
        },
        { $push: { 'schedule.$.taken': { $each: seats } } },
      )
      .exec();
    return result.modifiedCount === 1;
  }
}
