import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Scenario } from './Scenario';

@Entity()
export class DatabaseDefinition {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title: string;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @OneToMany(() => Scenario, (scenario) => scenario.databaseDefinition)
  scenarios!: Scenario[];

  constructor(
    title: string,
    host: string,
    port: number,
    username: string,
    password: string,
  ) {
    this.title = title;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }
}
