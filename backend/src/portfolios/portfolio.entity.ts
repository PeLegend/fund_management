import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Policy } from '../policies/policy.entity';
import { Order } from '../orders/order.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  portfolio_code: string;

  @Column({ type: 'uuid', nullable: false })
  customer_id: string;

  @Column({ type: 'uuid', nullable: false })
  policy_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Customer, (customer) => customer.portfolios)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Policy, (policy) => policy.portfolios, { eager: true })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @OneToMany(() => Order, (order) => order.portfolio)
  orders: Order[];
}
