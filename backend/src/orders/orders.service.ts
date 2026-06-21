import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus, OrderType } from './order.entity';
import { OrderStock } from './order-stock.entity';
import { Portfolio } from '../portfolios/portfolio.entity';
import { PolicyStock } from '../policies/policy-stock.entity';
import { Stock } from '../stocks/stock.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ALLOWED_TRANSITIONS } from '../common/constants/order-transitions';

interface Holding {
  stock_id: string;
  stock_code: string;
  stock_name: string;
  current_price: number;
  units: number;
  invested_amount: number;
  current_value: number;
}

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
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
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
    const orderType = (dto.order_type as OrderType) || OrderType.BUY;
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
      order_type: orderType,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepo.save(order) as Order;

    if (orderType === OrderType.SELL) {
      // SELL: calculate holdings and create sell order stocks
      const holdings = await this.calculateHoldings(portfolio.id);
      const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.current_value, 0);

      if (totalHoldingsValue <= 0) {
        throw new BadRequestException('No holdings to sell');
      }

      if (dto.amount > totalHoldingsValue) {
        throw new BadRequestException(
          `Sell amount ${dto.amount} exceeds holdings value ${totalHoldingsValue.toFixed(2)}`,
        );
      }

      // Distribute sell amount proportionally across holdings
      const orderStocks = holdings
        .filter((h) => h.current_value > 0)
        .map((h) => {
          const proportion = h.current_value / totalHoldingsValue;
          const allocated_amount = dto.amount * proportion;
          const units = Number((allocated_amount / h.current_price).toFixed(6));

          return {
            order_id: savedOrder.id,
            stock_id: h.stock_id,
            weight: Number((proportion * 100).toFixed(2)),
            allocated_amount,
            units,
            purchase_price: 0, // set at completion
          };
        });

      await this.orderStockRepo.save(orderStocks);
    } else {
      // BUY: snapshot money allocation
      const policyStocks = portfolio.policy.policy_stocks;
      const orderStocks = policyStocks.map((ps) => ({
        order_id: savedOrder.id,
        stock_id: ps.stock_id,
        weight: Number(ps.weight),
        allocated_amount: (dto.amount * Number(ps.weight)) / 100,
      }));

      await this.orderStockRepo.save(orderStocks);
    }

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
    const processingDelay = parseInt(process.env.ORDER_PROCESSING_DELAY || '2000', 10);
    const completionDelay = parseInt(process.env.ORDER_COMPLETION_DELAY || '5000', 10);

    this.logger.log(`Scheduling auto-processing for order ${orderId}: PROCESSING in ${processingDelay}ms, COMPLETED in ${completionDelay}ms`);

    // Move to PROCESSING
    setTimeout(async () => {
      try {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order || order.status !== OrderStatus.PENDING) return;

        order.status = OrderStatus.PROCESSING;
        await this.orderRepo.save(order);
        this.logger.log(`Order ${order.order_code} → PROCESSING`);

        // Move to COMPLETED or FAILED
        setTimeout(async () => {
          try {
            const order = await this.orderRepo.findOne({ where: { id: orderId } });
            if (!order || order.status !== OrderStatus.PROCESSING) return;

            // 80% success rate
            const success = Math.random() < 0.8;
            order.status = success ? OrderStatus.COMPLETED : OrderStatus.FAILED;
            await this.orderRepo.save(order);

            // Calculate units when order is completed
            if (success) {
              await this.calculateOrderUnits(orderId);
            }

            this.logger.log(`Order ${order.order_code} → ${order.status}`);
          } catch (err) {
            this.logger.error(`Auto-processing failed for order ${orderId}`, err);
          }
        }, completionDelay);
      } catch (err) {
        this.logger.error(`Auto-processing failed for order ${orderId}`, err);
      }
    }, processingDelay);
  }

  private async calculateOrderUnits(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;

    const orderStocks = await this.orderStockRepo.find({
      where: { order_id: orderId },
      relations: ['stock'],
    });

    for (const orderStock of orderStocks) {
      const stock = await this.stockRepo.findOne({
        where: { id: orderStock.stock_id },
      });

      if (stock && stock.current_price > 0) {
        if (order.order_type === OrderType.SELL) {
          // SELL: units are already set at creation, just record sell price
          orderStock.purchase_price = Number(stock.current_price);
        } else {
          // BUY: calculate units from amount and current price
          orderStock.purchase_price = Number(stock.current_price);
          orderStock.units = Number((orderStock.allocated_amount / stock.current_price).toFixed(6));
        }
        await this.orderStockRepo.save(orderStock);
      }
    }
  }

  private async calculateHoldings(portfolioId: string): Promise<Holding[]> {
    const orders = await this.orderRepo.find({
      where: { portfolio_id: portfolioId, status: OrderStatus.COMPLETED },
      relations: ['order_stocks', 'order_stocks.stock'],
    });

    const holdingsMap = new Map<string, Holding>();

    for (const order of orders) {
      for (const os of order.order_stocks) {
        if (!os.stock) continue;
        const key = os.stock.id;
        const existing = holdingsMap.get(key) || {
          stock_id: os.stock.id,
          stock_code: os.stock.stock_code,
          stock_name: os.stock.name,
          current_price: Number(os.stock.current_price),
          units: 0,
          invested_amount: 0,
          current_value: 0,
        };

        if (order.order_type === OrderType.BUY) {
          existing.units += Number(os.units);
          existing.invested_amount += Number(os.allocated_amount);
        } else {
          existing.units -= Number(os.units);
          existing.invested_amount -= Number(os.allocated_amount);
        }

        existing.current_value = existing.units * existing.current_price;
        holdingsMap.set(key, existing);
      }
    }

    return Array.from(holdingsMap.values()).filter((h) => h.units > 0);
  }
}
