import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderStock } from './order-stock.entity';
import { Portfolio } from '../portfolios/portfolio.entity';
import { PolicyStock } from '../policies/policy-stock.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderStock, Portfolio, PolicyStock])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
