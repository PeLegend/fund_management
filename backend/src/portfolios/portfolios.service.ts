import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Customer } from '../customers/customer.entity';
import { Policy } from '../policies/policy.entity';
import { Order, OrderStatus, OrderType } from '../orders/order.entity';
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
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async findByCustomer(customer_code: string): Promise<any[]> {
    const customer = await this.customerRepo.findOne({
      where: { customer_code },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customer_code} not found`);
    }

    const portfolios = await this.portfolioRepo.find({
      where: { customer_id: customer.id },
      relations: ['policy', 'policy.policy_stocks', 'policy.policy_stocks.stock', 'orders', 'orders.order_stocks.stock'],
    });

    return Promise.all(portfolios.map(p => this.calculatePortfolioValue(p)));
  }

  async findByCode(portfolio_code: string): Promise<any> {
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

    return this.calculatePortfolioValue(portfolio);
  }

  private async calculatePortfolioValue(portfolio: Portfolio): Promise<any> {
    let pendingAmount = 0;
    const holdingsMap = new Map<string, any>();

    if (portfolio.orders) {
      for (const order of portfolio.orders) {
        if (order.status === OrderStatus.COMPLETED && order.order_stocks) {
          for (const orderStock of order.order_stocks) {
            if (!orderStock.stock) continue;

            const invested = Number(orderStock.allocated_amount);
            const currentPrice = Number(orderStock.stock.current_price);
            const key = orderStock.stock.stock_code;

            const existing = holdingsMap.get(key) || {
              stock_code: orderStock.stock.stock_code,
              stock_name: orderStock.stock.name,
              units: 0,
              current_price: currentPrice,
              invested_amount: 0,
              current_value: 0,
              weight: 0,
            };

            if (order.order_type === OrderType.SELL) {
              // SELL: subtract holdings
              existing.units -= Number(orderStock.units);
              existing.invested_amount -= invested;
            } else {
              // BUY: add holdings
              existing.units += Number(orderStock.units);
              existing.invested_amount += invested;
            }

            existing.current_value = existing.units * existing.current_price;
            holdingsMap.set(key, existing);
          }
        } else if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) {
          pendingAmount += Number(order.amount);
        }
      }
    }

    const holdings = Array.from(holdingsMap.values()).filter((h) => h.units > 0);

    // Calculate weighted average buy price for each holding
    for (const holding of holdings) {
      holding.purchase_price = holding.units > 0
        ? Number((holding.invested_amount / holding.units).toFixed(2))
        : 0;
    }

    // Calculate gains for each holding
    for (const holding of holdings) {
      holding.gain_amount = holding.current_value - holding.invested_amount;
      holding.gain_percent = holding.invested_amount > 0
        ? (holding.gain_amount / holding.invested_amount) * 100
        : 0;
    }

    // Use holdings map for accurate totals (avoids double-counting across orders)
    const actualTotalInvested = holdings.reduce((sum, h) => sum + h.invested_amount, 0);
    const actualCurrentValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const gainAmount = actualCurrentValue - actualTotalInvested;
    const gainPercent = actualTotalInvested > 0 ? (gainAmount / actualTotalInvested) * 100 : 0;

    return {
      ...portfolio,
      current_value: actualCurrentValue,
      total_invested: actualTotalInvested,
      gain_amount: gainAmount,
      gain_percent: gainPercent,
      pending_amount: pendingAmount,
      holdings,
    };
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
