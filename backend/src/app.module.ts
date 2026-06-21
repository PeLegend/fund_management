import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { PoliciesModule } from './policies/policies.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { OrdersModule } from './orders/orders.module';
import { SeedModule } from './database/seed/seed.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // make ConfigService available everywhere
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // OK for interview test; disable in production
    }),
    AuthModule,
    AdminModule,
    CustomersModule,
    PoliciesModule,
    PortfoliosModule,
    OrdersModule,
    SeedModule,
  ],
})
export class AppModule {}
