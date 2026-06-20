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
    const customerCount = await this.customerRepo.count();
    if (customerCount > 0) {
      this.logger.log('Database already seeded, skipping');
      return;
    }

    this.logger.log('Seeding database...');

    // Customers
    const customers = await this.customerRepo.save([
      { customer_code: 'C001', name: 'สมชาย ใจดี' },
      { customer_code: 'C002', name: 'สมหญิง รักเรียน' },
    ]);

    // Stocks
    const stocks = await this.stockRepo.save([
      { stock_code: 'PTT', name: 'ปตท.' },
      { stock_code: 'SCB', name: 'ไทยพาณิชย์' },
      { stock_code: 'CPALL', name: 'ซีพี ออลล์' },
      { stock_code: 'KBANK', name: 'กสิกรไทย' },
      { stock_code: 'BBL', name: 'กรุงเทพ' },
      { stock_code: 'ADVANC', name: 'แอดวานซ์ อินโฟ' },
      { stock_code: 'TRUE', name: 'ทรู คอร์ปอเรชั่น' },
      { stock_code: 'DTAC', name: 'โทเทิ่ล แอ็คเซ็ส' },
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
}
