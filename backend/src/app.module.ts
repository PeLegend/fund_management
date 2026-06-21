import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { PoliciesModule } from './policies/policies.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { OrdersModule } from './orders/orders.module';
import { SeedModule } from './database/seed/seed.module';
import { AuthModule } from './auth/auth';
import { StocksModule } from './stocks/stocks.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AdminController } from './admin.controller';
import { Customer } from './customers/customer.entity';
import { Stock } from './stocks/stock.entity';
import { Policy } from './policies/policy.entity';
import { PolicyStock } from './policies/policy-stock.entity';
import { Portfolio } from './portfolios/portfolio.entity';
import { Order } from './orders/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // dev only — disable in production
    }),
    // AdminController needs repositories directly — provide them here
    TypeOrmModule.forFeature([Customer, Stock, Policy, PolicyStock, Portfolio, Order]),
    AuthModule,
    CustomersModule,
    PoliciesModule,
    PortfoliosModule,
    OrdersModule,
    SeedModule,
    StocksModule,
    ChatbotModule,
  ],
  controllers: [AdminController],
})
export class AppModule {}
