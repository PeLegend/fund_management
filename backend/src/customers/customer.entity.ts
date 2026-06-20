import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Portfolio } from '../portfolios/portfolio.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: false })
  customer_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.customer)
  portfolios: Portfolio[];
}
