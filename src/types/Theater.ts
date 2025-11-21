import type { Seat } from './Seat';

export interface Theater {
  id: number;
  name: string;
  capacity: number;
  seats?: Seat[];
}
