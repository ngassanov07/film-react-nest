import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FilmDto, ScheduleDto } from '../films/dto/films.dto';
import { Film } from '../films/entities/film.entity';
import { Schedule } from '../films/entities/schedule.entity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class FilmsRepository {
  constructor(
    @InjectRepository(Film) private readonly films: Repository<Film>,
    private readonly dataSource: DataSource,
  ) {}

  private toScheduleDto(entity: Schedule): ScheduleDto {
    return {
      id: entity.id,
      daytime: entity.daytime,
      hall: entity.hall,
      rows: entity.rows,
      seats: entity.seats,
      price: entity.price,
      taken: [...entity.taken],
    };
  }

  private toFilmDto(entity: Film): FilmDto {
    return {
      id: entity.id,
      rating: entity.rating,
      director: entity.director,
      tags: [...entity.tags],
      title: entity.title,
      about: entity.about,
      description: entity.description,
      image: entity.image,
      cover: entity.cover,
      schedule: (entity.schedule ?? []).map((s) => this.toScheduleDto(s)),
    };
  }

  async findAll(): Promise<FilmDto[]> {
    const films = await this.films.find();
    return films.map((film) => this.toFilmDto(film));
  }

  async findById(id: string): Promise<FilmDto | null> {
    if (!UUID_PATTERN.test(id)) {
      return null;
    }
    const film = await this.films.findOne({
      where: { id },
      relations: { schedule: true },
      order: { schedule: { daytime: 'ASC' } },
    });
    return film ? this.toFilmDto(film) : null;
  }

  async takeSeats(
    filmId: string,
    sessionId: string,
    seats: string[],
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(Schedule, {
        where: { id: sessionId, film: { id: filmId } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session || seats.some((seat) => session.taken.includes(seat))) {
        return false;
      }
      session.taken = [...session.taken, ...seats];
      await manager.save(session);
      return true;
    });
  }
}
