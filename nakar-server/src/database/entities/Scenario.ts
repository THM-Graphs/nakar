import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Database } from './Database';

@Entity()
export class Scenario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  query!: string;

  @ManyToOne((type) => Database, (database) => database.scenarios)
  database!: Database;
}
