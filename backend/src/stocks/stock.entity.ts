import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PolicyStock } from '../policies/policy-stock.entity';
import { OrderStock } from '../orders/order-stock.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: false })
  stock_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => PolicyStock, (policyStock) => policyStock.stock)
  policy_stocks: PolicyStock[];

  @OneToMany(() => OrderStock, (orderStock) => orderStock.stock)
  order_stocks: OrderStock[];
}
