import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../portfolios/portfolio.entity';

@Injectable()
export class AdminPortfoliosService {
  constructor(
    @InjectRepository(Portfolio) private readonly portfolioRepo: Repository<Portfolio>,
  ) {}

  async findAll(): Promise<Portfolio[]> {
    return this.portfolioRepo.find({
      relations: ['customer', 'policy', 'orders'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id },
      relations: ['customer', 'policy', 'policy.policy_stocks', 'policy.policy_stocks.stock', 'orders', 'orders.order_stocks', 'orders.order_stocks.stock'],
    });
    if (!portfolio) throw new NotFoundException(`Portfolio ${id} not found`);
    return portfolio;
  }
}
