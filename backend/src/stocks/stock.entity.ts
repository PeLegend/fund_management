import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PolicyStock } from '../policies/policy-stock.entity';
import { OrderStock } from '../orders/order-stock.entity';
import { StockPriceHistory } from './stock-price-history.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: false })
  stock_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  current_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  previous_close: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_change: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  price_change_percent: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => PolicyStock, (policyStock) => policyStock.stock)
  policy_stocks: PolicyStock[];

  @OneToMany(() => OrderStock, (orderStock) => orderStock.stock)
  order_stocks: OrderStock[];

  @OneToMany(() => StockPriceHistory, (history) => history.stock)
  price_history: StockPriceHistory[];
}
