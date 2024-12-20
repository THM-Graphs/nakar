import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { DatabaseDefinition } from './DatabaseDefinition';

@Entity()
export class Scenario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title: string;

  @Column()
  query: string;

  @ManyToOne(
    () => DatabaseDefinition,
    (databaseDefinition) => databaseDefinition.scenarios,
    {
      eager: true,
    },
  )
  databaseDefinition: DatabaseDefinition;

  @CreateDateColumn()
  createDate!: Date;

  @UpdateDateColumn()
  updateDate!: Date;

  @VersionColumn()
  version!: number;

  constructor(
    title: string,
    query: string,
    databaseDefinition: DatabaseDefinition,
  ) {
    this.title = title;
    this.query = query;
    this.databaseDefinition = databaseDefinition;
  }
}
