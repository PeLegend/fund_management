import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Stock } from './stock.entity';
import { StockPriceHistory } from './stock-price-history.entity';

@Injectable()
export class PriceSimulatorService implements OnModuleInit {
  private readonly logger = new Logger(PriceSimulatorService.name);

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(StockPriceHistory)
    private readonly priceHistoryRepo: Repository<StockPriceHistory>,
  ) {}

  async onModuleInit() {
    await this.generateHistoricalData();
  }

  // Simulate price every 30 seconds
  @Cron(CronExpression.EVERY_30_SECONDS)
  async simulatePrices() {
    const stocks = await this.stockRepo.find();

    for (const stock of stocks) {
      const oldPrice = Number(stock.current_price);
      const changePercent = (Math.random() - 0.48) * 0.06; // -2.88% to +3.12%
      const newPrice = Math.max(1, oldPrice * (1 + changePercent));

      stock.price_change = Number((newPrice - oldPrice).toFixed(2));
      stock.price_change_percent = Number(((newPrice - oldPrice) / oldPrice * 100).toFixed(4));
      stock.previous_close = oldPrice;
      stock.current_price = Number(newPrice.toFixed(2));

      await this.stockRepo.save(stock);

      // Save to history
      await this.priceHistoryRepo.save(
        this.priceHistoryRepo.create({
          stock_id: stock.id,
          price: stock.current_price,
        }),
      );
    }

    this.logger.debug(`Simulated prices for ${stocks.length} stocks`);
  }

  private async generateHistoricalData() {
    const stocks = await this.stockRepo.find();

    for (const stock of stocks) {
      const existingCount = await this.priceHistoryRepo.count({
        where: { stock_id: stock.id },
      });

      if (existingCount > 0) continue; // Already generated

      this.logger.log(`Generating 30-day history for ${stock.stock_code}`);

      let price = Number(stock.current_price) || 50;
      const now = new Date();

      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(16, 0, 0, 0); // Market close time

        if (i === 0) {
          // Today's price is the current price
          price = Number(stock.current_price) || price;
        } else {
          // Random walk for historical data
          const change = (Math.random() - 0.48) * 0.04;
          price = Math.max(1, price * (1 + change));
        }

        await this.priceHistoryRepo.save(
          this.priceHistoryRepo.create({
            stock_id: stock.id,
            price: Number(price.toFixed(2)),
            recorded_at: date,
          }),
        );
      }

      // Set current price if not set
      if (!stock.current_price || stock.current_price === 0) {
        stock.current_price = Number(price.toFixed(2));
        stock.previous_close = Number((price * 0.99).toFixed(2));
        stock.price_change = Number((price * 0.01).toFixed(2));
        stock.price_change_percent = 1.0;
        await this.stockRepo.save(stock);
      }
    }
  }

  async getHistory(stockId: string, days = 30): Promise<StockPriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.priceHistoryRepo.find({
      where: {
        stock_id: stockId,
        recorded_at: MoreThan(startDate),
      },
      order: { recorded_at: 'ASC' },
    });
  }
}
