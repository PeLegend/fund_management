import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './stock.entity';
import { PriceSimulatorService } from './price-simulator.service';

@Controller('stocks')
export class StocksController {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    private readonly priceSimulator: PriceSimulatorService,
  ) {}

  @Get()
  async findAll() {
    return this.stockRepo.find({
      order: { stock_code: 'ASC' },
    });
  }

  @Get(':code')
  async findByCode(@Param('code') code: string) {
    const stock = await this.stockRepo.findOne({
      where: { stock_code: code.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException(`Stock ${code} not found`);
    }

    return stock;
  }

  @Get(':code/history')
  async getHistory(
    @Param('code') code: string,
    @Query('days') days = '30',
  ) {
    const stock = await this.stockRepo.findOne({
      where: { stock_code: code.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException(`Stock ${code} not found`);
    }

    return this.priceSimulator.getHistory(stock.id, parseInt(days, 10));
  }
}
