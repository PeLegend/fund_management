import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderStock } from './order-stock.entity';
import { Portfolio } from '../portfolios/portfolio.entity';
import { PolicyStock } from '../policies/policy-stock.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.FAILED],
  [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.FAILED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.FAILED]: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderStock)
    private readonly orderStockRepo: Repository<OrderStock>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(PolicyStock)
    private readonly policyStockRepo: Repository<PolicyStock>,
  ) {}

  async findByPortfolio(portfolio_code: string): Promise<Order[]> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { portfolio_code },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${portfolio_code} not found`);
    }

    return this.orderRepo.find({
      where: { portfolio_id: portfolio.id },
      relations: ['order_stocks', 'order_stocks.stock'],
      order: { created_at: 'DESC' },
    });
  }

  async findByCode(order_code: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { order_code },
      relations: ['order_stocks', 'order_stocks.stock', 'portfolio'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${order_code} not found`);
    }

    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { portfolio_code: dto.portfolio_code },
      relations: ['policy', 'policy.policy_stocks', 'policy.policy_stocks.stock'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${dto.portfolio_code} not found`);
    }

    // Duplicate order prevention
    const activeOrder = await this.orderRepo.findOne({
      where: {
        portfolio_id: portfolio.id,
        status: In([OrderStatus.PENDING, OrderStatus.PROCESSING]),
      },
    });

    if (activeOrder) {
      throw new ConflictException(
        `Portfolio ${dto.portfolio_code} already has an active order`,
      );
    }

    // Generate order code
    const count = await this.orderRepo.count();
    const order_code = `O${String(count + 1).padStart(3, '0')}`;

    // Create order
    const order = this.orderRepo.create({
      order_code,
      portfolio_id: portfolio.id,
      amount: dto.amount,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Snapshot money allocation
    const policyStocks = portfolio.policy.policy_stocks;
    const orderStocks = policyStocks.map((ps) => ({
      order_id: savedOrder.id,
      stock_id: ps.stock_id,
      weight: Number(ps.weight),
      allocated_amount: (dto.amount * Number(ps.weight)) / 100,
    }));

    await this.orderStockRepo.save(orderStocks);

    // Auto-processing with setTimeout
    this.scheduleAutoProcessing(savedOrder.id);

    return this.findByCode(savedOrder.order_code);
  }

  async cancel(order_code: string): Promise<Order> {
    const order = await this.findByCode(order_code);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel order ${order_code}: status is ${order.status}, only PENDING orders can be cancelled`,
      );
    }

    order.status = OrderStatus.FAILED;
    await this.orderRepo.save(order);

    return this.findByCode(order_code);
  }

  async updateStatus(order_code: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findByCode(order_code);

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    order.status = dto.status as OrderStatus;
    await this.orderRepo.save(order);

    return this.findByCode(order_code);
  }

  private scheduleAutoProcessing(orderId: string): void {
    // Move to PROCESSING after 2 seconds
    setTimeout(async () => {
      try {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order || order.status !== OrderStatus.PENDING) return;

        order.status = OrderStatus.PROCESSING;
        await this.orderRepo.save(order);
        this.logger.log(`Order ${order.order_code} → PROCESSING`);

        // Move to COMPLETED or FAILED after 5 more seconds
        setTimeout(async () => {
          try {
            const order = await this.orderRepo.findOne({ where: { id: orderId } });
            if (!order || order.status !== OrderStatus.PROCESSING) return;

            // 80% success rate
            const success = Math.random() < 0.8;
            order.status = success ? OrderStatus.COMPLETED : OrderStatus.FAILED;
            await this.orderRepo.save(order);
            this.logger.log(`Order ${order.order_code} → ${order.status}`);
          } catch (err) {
            this.logger.error(`Auto-processing failed for order ${orderId}`, err);
          }
        }, 5000);
      } catch (err) {
        this.logger.error(`Auto-processing failed for order ${orderId}`, err);
      }
    }, 2000);
  }
}
