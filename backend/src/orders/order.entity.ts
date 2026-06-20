import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Portfolio } from '../portfolios/portfolio.entity';
import { OrderStock } from './order-stock.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  order_code: string;

  @Column({ type: 'uuid', nullable: false })
  portfolio_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.orders)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @OneToMany(() => OrderStock, (orderStock) => orderStock.order, { eager: true })
  order_stocks: OrderStock[];
}
