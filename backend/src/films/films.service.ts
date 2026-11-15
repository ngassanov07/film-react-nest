import { Injectable, NotFoundException } from '@nestjs/common';
import { FilmsRepository } from '../repository/films.repository';
import { FilmsListResponseDto, ScheduleResponseDto } from './dto/films.dto';

@Injectable()
export class FilmsService {
  constructor(private readonly filmsRepository: FilmsRepository) {}

  async findAll(): Promise<FilmsListResponseDto> {
    const films = await this.filmsRepository.findAll();
    const items = films.map(({ schedule, ...film }) => {
      void schedule;
      return film;
    });
    return { total: items.length, items };
  }

  async findSchedule(id: string): Promise<ScheduleResponseDto> {
    const film = await this.filmsRepository.findById(id);
    if (!film) {
      throw new NotFoundException(`Film ${id} not found`);
    }
    return { total: film.schedule.length, items: film.schedule };
  }
}
