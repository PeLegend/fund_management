import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Stock } from './stock.entity';

@Entity('stock_price_history')
export class StockPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  stock_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @CreateDateColumn()
  recorded_at: Date;

  @ManyToOne(() => Stock, (stock) => stock.price_history)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
