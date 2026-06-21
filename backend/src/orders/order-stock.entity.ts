import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Order } from './order.entity';
import { Stock } from '../stocks/stock.entity';

@Entity('order_stocks')
@Index(['order_id'])
export class OrderStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  order_id: string;

  @Column({ type: 'uuid', nullable: false })
  stock_id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  weight: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: false })
  allocated_amount: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  units: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  purchase_price: number;

  @ManyToOne(() => Order, (order) => order.order_stocks)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Stock, (stock) => stock.order_stocks)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
