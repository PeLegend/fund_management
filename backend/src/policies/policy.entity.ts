import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PolicyStock } from './policy-stock.entity';
import { Portfolio } from '../portfolios/portfolio.entity';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  policy_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => PolicyStock, (policyStock) => policyStock.policy, { eager: true })
  policy_stocks: PolicyStock[];

  @OneToMany(() => Portfolio, (portfolio) => portfolio.policy)
  portfolios: Portfolio[];
}
