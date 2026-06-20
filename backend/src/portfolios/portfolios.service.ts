import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Customer } from '../customers/customer.entity';
import { Policy } from '../policies/policy.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
  ) {}

  async findByCustomer(customer_code: string): Promise<Portfolio[]> {
    const customer = await this.customerRepo.findOne({
      where: { customer_code },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customer_code} not found`);
    }

    return this.portfolioRepo.find({
      where: { customer_id: customer.id },
      relations: ['policy', 'policy.policy_stocks', 'policy.policy_stocks.stock', 'orders', 'orders.order_stocks.stock'],
    });
  }

  async findByCode(portfolio_code: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { portfolio_code },
      relations: [
        'customer',
        'policy',
        'policy.policy_stocks',
        'policy.policy_stocks.stock',
        'orders',
        'orders.order_stocks.stock',
      ],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${portfolio_code} not found`);
    }

    return portfolio;
  }

  async create(dto: CreatePortfolioDto): Promise<Portfolio> {
    const customer = await this.customerRepo.findOne({
      where: { customer_code: dto.customer_code },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customer_code} not found`);
    }

    const policy = await this.policyRepo.findOne({
      where: { policy_code: dto.policy_code },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${dto.policy_code} not found`);
    }

    // Check 1 portfolio per policy per customer
    const existing = await this.portfolioRepo.findOne({
      where: {
        customer_id: customer.id,
        policy_id: policy.id,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Customer ${dto.customer_code} already has a portfolio for policy ${dto.policy_code}`,
      );
    }

    // Generate portfolio code
    const count = await this.portfolioRepo.count();
    const portfolio_code = `P${String(count + 1).padStart(3, '0')}`;

    const portfolio = this.portfolioRepo.create({
      portfolio_code,
      customer_id: customer.id,
      policy_id: policy.id,
    });

    return this.portfolioRepo.save(portfolio);
  }
}
