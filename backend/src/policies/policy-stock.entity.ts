import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Policy } from './policy.entity';
import { Stock } from '../stocks/stock.entity';

@Entity('policy_stocks')
@Unique(['policy_id', 'stock_id'])
export class PolicyStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  policy_id: string;

  @Column({ type: 'uuid', nullable: false })
  stock_id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  weight: number;

  @ManyToOne(() => Policy, (policy) => policy.policy_stocks)
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @ManyToOne(() => Stock, (stock) => stock.policy_stocks)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
