export class TicketDto {
  film: string;
  session: string;
  daytime: string;
  row: number;
  seat: number;
  price: number;
}

export class CreateOrderDto {
  email: string;
  phone: string;
  tickets: TicketDto[];
}

export class TicketResultDto extends TicketDto {
  id: string;
}

export class OrderResponseDto {
  total: number;
  items: TicketResultDto[];
}
