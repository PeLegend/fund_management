import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Customer } from '../../customers/customer.entity';
import { Stock } from '../../stocks/stock.entity';
import { Policy } from '../../policies/policy.entity';
import { PolicyStock } from '../../policies/policy-stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Stock, Policy, PolicyStock])],
  providers: [SeedService],
})
export class SeedModule {}
