import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../customers/customer.entity';
import { Stock } from '../../stocks/stock.entity';
import { Policy } from '../../policies/policy.entity';
import { PolicyStock } from '../../policies/policy-stock.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyStock)
    private readonly policyStockRepo: Repository<PolicyStock>,
  ) {}

  async onModuleInit() {
    // Seed business data only if not already seeded
    const customerCount = await this.customerRepo.count();
    if (customerCount > 0) {
      this.logger.log('Database already seeded, checking stock prices...');
      await this.updateStockPrices();
      return;
    }

    this.logger.log('Seeding database...');

    // Customers
    const customers = await this.customerRepo.save([
      { customer_code: 'C001', name: 'สมชาย ใจดี' },
      { customer_code: 'C002', name: 'สมหญิง รักเรียน' },
    ]);

    // Stocks (with initial prices)
    const stocks = await this.stockRepo.save([
      { stock_code: 'PTT', name: 'ปตท.', current_price: 34.50, previous_close: 34.00 },
      { stock_code: 'SCB', name: 'ไทยพาณิชย์', current_price: 48.20, previous_close: 47.80 },
      { stock_code: 'CPALL', name: 'ซีพี ออลล์', current_price: 67.80, previous_close: 67.25 },
      { stock_code: 'KBANK', name: 'กสิกรไทย', current_price: 28.90, previous_close: 28.60 },
      { stock_code: 'BBL', name: 'กรุงเทพ', current_price: 185.50, previous_close: 184.00 },
      { stock_code: 'ADVANC', name: 'แอดวานซ์ อินโฟ', current_price: 245.00, previous_close: 243.50 },
      { stock_code: 'TRUE', name: 'ทรู คอร์ปอเรชั่น', current_price: 8.45, previous_close: 8.35 },
      { stock_code: 'DTAC', name: 'โทเทิ่ล แอ็คเซ็ส', current_price: 52.30, previous_close: 51.80 },
    ]);

    // Policies
    const policies = await this.policyRepo.save([
      { policy_code: 'KMASTER', name: 'นโยบายหุ้นไทย' },
      { policy_code: 'TMBUSB', name: 'นโยบายตราสารหนี้' },
      { policy_code: 'SCBDV', name: 'นโยบายหุ้นปันผล' },
    ]);

    // Policy Stocks (weights)
    const stockMap = new Map(stocks.map((s) => [s.stock_code, s]));
    const policyMap = new Map(policies.map((p) => [p.policy_code, p]));

    const kmaster = policyMap.get('KMASTER')!;
    const tmbusb = policyMap.get('TMBUSB')!;
    const scbdv = policyMap.get('SCBDV')!;

    await this.policyStockRepo.save([
      { policy_id: kmaster.id, stock_id: stockMap.get('PTT')!.id, weight: 40 },
      { policy_id: kmaster.id, stock_id: stockMap.get('SCB')!.id, weight: 35 },
      { policy_id: kmaster.id, stock_id: stockMap.get('CPALL')!.id, weight: 25 },
      { policy_id: tmbusb.id, stock_id: stockMap.get('KBANK')!.id, weight: 50 },
      { policy_id: tmbusb.id, stock_id: stockMap.get('BBL')!.id, weight: 50 },
      { policy_id: scbdv.id, stock_id: stockMap.get('ADVANC')!.id, weight: 40 },
      { policy_id: scbdv.id, stock_id: stockMap.get('TRUE')!.id, weight: 30 },
      { policy_id: scbdv.id, stock_id: stockMap.get('DTAC')!.id, weight: 30 },
    ]);

    this.logger.log('Database seeded successfully');
  }

  private async updateStockPrices() {
    const stocks = await this.stockRepo.find();
    const initialPrices: Record<string, { price: number; prevClose: number }> = {
      'PTT': { price: 34.50, prevClose: 34.00 },
      'SCB': { price: 48.20, prevClose: 47.80 },
      'CPALL': { price: 67.80, prevClose: 67.25 },
      'KBANK': { price: 28.90, prevClose: 28.60 },
      'BBL': { price: 185.50, prevClose: 184.00 },
      'ADVANC': { price: 245.00, prevClose: 243.50 },
      'TRUE': { price: 8.45, prevClose: 8.35 },
      'DTAC': { price: 52.30, prevClose: 51.80 },
    };

    let updated = 0;
    for (const stock of stocks) {
      const currentPrice = Number(stock.current_price);
      if (!currentPrice || currentPrice === 0) {
        const initial = initialPrices[stock.stock_code];
        if (initial) {
          stock.current_price = initial.price;
          stock.previous_close = initial.prevClose;
          stock.price_change = Number((initial.price - initial.prevClose).toFixed(2));
          stock.price_change_percent = Number(((initial.price - initial.prevClose) / initial.prevClose * 100).toFixed(4));
          await this.stockRepo.save(stock);
          updated++;
        }
      }
    }

    if (updated > 0) {
      this.logger.log(`Updated prices for ${updated} stocks`);
    }
  }
}
