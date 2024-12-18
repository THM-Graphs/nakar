import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Scenario } from './Scenario';

@Entity()
export class Database {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  host!: string;

  @Column()
  port!: number;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @OneToMany((type) => Scenario, (scenario) => scenario.database)
  scenarios!: Scenario[];
}
