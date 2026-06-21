import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Stock } from './stock.entity';
import { StockPriceHistory } from './stock-price-history.entity';
import { StocksController } from './stocks.controller';
import { PriceSimulatorService } from './price-simulator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, StockPriceHistory]),
    ScheduleModule.forRoot(),
  ],
  controllers: [StocksController],
  providers: [PriceSimulatorService],
  exports: [PriceSimulatorService],
})
export class StocksModule {}
