import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../customers/customer.entity';
import { Stock } from '../../stocks/stock.entity';
import { Policy } from '../../policies/policy.entity';
import { Portfolio } from '../../portfolios/portfolio.entity';
import { Order, OrderStatus } from '../../orders/order.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Policy) private readonly policyRepo: Repository<Policy>,
    @InjectRepository(Portfolio) private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async getStats() {
    const [totalCustomers, totalStocks, totalPolicies, totalPortfolios, totalOrders] = await Promise.all([
      this.customerRepo.count(),
      this.stockRepo.count(),
      this.policyRepo.count(),
      this.portfolioRepo.count(),
      this.orderRepo.count(),
    ]);

    const ordersByStatus = await Promise.all(
      Object.values(OrderStatus).map(async (status) => ({
        status,
        count: await this.orderRepo.count({ where: { status } }),
      })),
    );

    return {
      totalCustomers,
      totalStocks,
      totalPolicies,
      totalPortfolios,
      totalOrders,
      ordersByStatus,
    };
  }
}
