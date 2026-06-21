import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { Stock } from '../stocks/stock.entity';
import { Policy } from '../policies/policy.entity';
import { PolicyStock } from '../policies/policy-stock.entity';
import { Portfolio } from '../portfolios/portfolio.entity';
import { Order } from '../orders/order.entity';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminCustomersController } from './customers/admin-customers.controller';
import { AdminCustomersService } from './customers/admin-customers.service';
import { AdminStocksController } from './stocks/admin-stocks.controller';
import { AdminStocksService } from './stocks/admin-stocks.service';
import { AdminPoliciesController } from './policies/admin-policies.controller';
import { AdminPoliciesService } from './policies/admin-policies.service';
import { AdminPortfoliosController } from './portfolios/admin-portfolios.controller';
import { AdminPortfoliosService } from './portfolios/admin-portfolios.service';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminOrdersService } from './orders/admin-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Stock, Policy, PolicyStock, Portfolio, Order]),
  ],
  controllers: [
    AdminDashboardController,
    AdminCustomersController,
    AdminStocksController,
    AdminPoliciesController,
    AdminPortfoliosController,
    AdminOrdersController,
  ],
  providers: [
    AdminDashboardService,
    AdminCustomersService,
    AdminStocksService,
    AdminPoliciesService,
    AdminPortfoliosService,
    AdminOrdersService,
  ],
})
export class AdminModule {}
