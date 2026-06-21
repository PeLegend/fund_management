import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../orders/order.entity';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.FAILED],
  [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.FAILED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.FAILED]: [],
};

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async findAll(status?: string): Promise<Order[]> {
    const where = status ? { status: status as OrderStatus } : {};
    return this.orderRepo.find({
      where,
      relations: ['order_stocks', 'order_stocks.stock', 'portfolio', 'portfolio.customer', 'portfolio.policy'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['order_stocks', 'order_stocks.stock', 'portfolio', 'portfolio.customer', 'portfolio.policy'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    const order = await this.findOne(id);
    const newStatus = status as OrderStatus;

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`,
      );
    }

    order.status = newStatus;
    await this.orderRepo.save(order);
    return this.findOne(id);
  }
}
