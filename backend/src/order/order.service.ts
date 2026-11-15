import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FilmDto } from '../films/dto/films.dto';
import { FilmsRepository } from '../repository/films.repository';
import {
  CreateOrderDto,
  OrderResponseDto,
  TicketResultDto,
} from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly filmsRepository: FilmsRepository) {}

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const tickets = dto?.tickets;
    if (!Array.isArray(tickets) || tickets.length === 0) {
      throw new BadRequestException('Order must contain at least one ticket');
    }

    const films = new Map<string, FilmDto>();
    const seatsBySession = new Map<
      string,
      { film: string; session: string; seats: string[] }
    >();
    const items: TicketResultDto[] = [];

    for (const ticket of tickets) {
      const { film: filmId, session: sessionId, row, seat } = ticket ?? {};
      if (!filmId || !sessionId) {
        throw new BadRequestException('Ticket must contain film and session');
      }

      let film = films.get(filmId);
      if (!film) {
        film = await this.filmsRepository.findById(filmId);
        if (!film) {
          throw new BadRequestException(`Film ${filmId} not found`);
        }
        films.set(filmId, film);
      }

      const session = film.schedule.find((s) => s.id === sessionId);
      if (!session) {
        throw new BadRequestException(`Session ${sessionId} not found`);
      }

      if (
        !Number.isInteger(row) ||
        !Number.isInteger(seat) ||
        row < 1 ||
        seat < 1 ||
        row > session.rows ||
        seat > session.seats
      ) {
        throw new BadRequestException(`Seat ${row}:${seat} does not exist`);
      }

      const place = `${row}:${seat}`;
      const key = `${filmId}/${sessionId}`;
      const group = seatsBySession.get(key) ?? {
        film: filmId,
        session: sessionId,
        seats: [],
      };

      if (session.taken.includes(place) || group.seats.includes(place)) {
        throw new BadRequestException(`Seat ${place} is already taken`);
      }

      group.seats.push(place);
      seatsBySession.set(key, group);
      items.push({
        ...ticket,
        daytime: session.daytime,
        price: session.price,
        id: randomUUID(),
      });
    }

    for (const { film, session, seats } of seatsBySession.values()) {
      const saved = await this.filmsRepository.takeSeats(film, session, seats);
      if (!saved) {
        throw new BadRequestException('Some of the selected seats are taken');
      }
    }

    return { total: items.length, items };
  }
}
