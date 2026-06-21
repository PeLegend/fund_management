import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from './auth/auth';
import { Customer } from './customers/customer.entity';
import { Stock } from './stocks/stock.entity';
import { Policy } from './policies/policy.entity';
import { PolicyStock } from './policies/policy-stock.entity';
import { Portfolio } from './portfolios/portfolio.entity';
import { Order, OrderStatus } from './orders/order.entity';
import { ALLOWED_TRANSITIONS } from './common/constants/order-transitions';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Policy) private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyStock) private readonly policyStockRepo: Repository<PolicyStock>,
    @InjectRepository(Portfolio) private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  // ─── Dashboard ─────────────────────────────────────────

  @Get('dashboard')
  async getDashboard() {
    const [customerCount, stockCount, policyCount, portfolioCount, orders] = await Promise.all([
      this.customerRepo.count(),
      this.stockRepo.count(),
      this.policyRepo.count(),
      this.portfolioRepo.count(),
      this.orderRepo.find(),
    ]);

    // Count orders by status
    const statusCounts = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Convert to array format expected by frontend
    const ordersByStatus = [
      { status: 'PENDING' as const, count: statusCounts['PENDING'] || 0 },
      { status: 'PROCESSING' as const, count: statusCounts['PROCESSING'] || 0 },
      { status: 'COMPLETED' as const, count: statusCounts['COMPLETED'] || 0 },
      { status: 'FAILED' as const, count: statusCounts['FAILED'] || 0 },
    ];

    return {
      totalCustomers: customerCount,
      totalStocks: stockCount,
      totalPolicies: policyCount,
      totalPortfolios: portfolioCount,
      totalOrders: orders.length,
      ordersByStatus,
    };
  }

  // ─── Customers ─────────────────────────────────────────

  @Get('customers')
  async listCustomers(@Query('page') page = '1', @Query('limit') limit = '10') {
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [items, total] = await this.customerRepo.findAndCount({
      skip, take,
      order: { created_at: 'DESC' },
    });

    return { items, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  @Get('customers/:id')
  async getCustomer(@Param('id') id: string) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  @Post('customers')
  async createCustomer(@Body() body: { customer_code: string; name: string }) {
    if (!body.customer_code || !body.name) {
      throw new BadRequestException('customer_code and name are required');
    }
    const code = body.customer_code.trim().toUpperCase();
    const name = body.name.trim();
    if (!code || !name) throw new BadRequestException('customer_code and name cannot be empty');

    const existing = await this.customerRepo.findOne({ where: { customer_code: code } });
    if (existing) throw new ConflictException(`Customer ${code} already exists`);

    return this.customerRepo.save(this.customerRepo.create({ customer_code: code, name }));
  }

  @Patch('customers/:id')
  async updateCustomer(@Param('id') id: string, @Body() body: { name?: string }) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    if (body.name) customer.name = body.name.trim();
    return this.customerRepo.save(customer);
  }

  @Delete('customers/:id')
  async deleteCustomer(@Param('id') id: string) {
    const result = await this.customerRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Customer ${id} not found`);
    return { deleted: true };
  }

  // ─── Stocks ────────────────────────────────────────────

  @Get('stocks')
  async listStocks() {
    return this.stockRepo.find({ order: { stock_code: 'ASC' } });
  }

  @Post('stocks')
  async createStock(@Body() body: { stock_code: string; name: string }) {
    if (!body.stock_code || !body.name) {
      throw new BadRequestException('stock_code and name are required');
    }
    const code = body.stock_code.trim().toUpperCase();
    const name = body.name.trim();
    if (!code || !name) throw new BadRequestException('stock_code and name cannot be empty');

    const existing = await this.stockRepo.findOne({ where: { stock_code: code } });
    if (existing) throw new ConflictException(`Stock ${code} already exists`);

    return this.stockRepo.save(this.stockRepo.create({ stock_code: code, name }));
  }

  @Patch('stocks/:id')
  async updateStock(@Param('id') id: string, @Body() body: { stock_code?: string; name?: string }) {
    const stock = await this.stockRepo.findOne({ where: { id } });
    if (!stock) throw new NotFoundException(`Stock ${id} not found`);
    if (body.stock_code) stock.stock_code = body.stock_code.trim().toUpperCase();
    if (body.name) stock.name = body.name.trim();
    return this.stockRepo.save(stock);
  }

  @Delete('stocks/:id')
  async deleteStock(@Param('id') id: string) {
    const result = await this.stockRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Stock ${id} not found`);
    return { deleted: true };
  }

  // ─── Policies ──────────────────────────────────────────

  @Get('policies')
  async listPolicies() {
    return this.policyRepo.find({
      relations: ['policy_stocks', 'policy_stocks.stock'],
      order: { policy_code: 'ASC' },
    });
  }

  @Get('policies/:id')
  async getPolicy(@Param('id') id: string) {
    const policy = await this.policyRepo.findOne({
      where: { id },
      relations: ['policy_stocks', 'policy_stocks.stock'],
    });
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return policy;
  }

  @Post('policies')
  async createPolicy(@Body() body: { policy_code: string; name: string; policy_stocks: { stock_id: string; weight: number }[] }) {
    if (!body.policy_code || !body.name) {
      throw new BadRequestException('policy_code and name are required');
    }
    const code = body.policy_code.trim().toUpperCase();
    const name = body.name.trim();
    if (!code || !name) throw new BadRequestException('policy_code and name cannot be empty');

    const existing = await this.policyRepo.findOne({ where: { policy_code: code } });
    if (existing) throw new ConflictException(`Policy ${code} already exists`);

    const policy = await this.policyRepo.save(
      this.policyRepo.create({ policy_code: code, name }),
    );

    if (body.policy_stocks?.length) {
      await this.policyStockRepo.save(
        body.policy_stocks.map((ps) => ({
          policy_id: policy.id,
          stock_id: ps.stock_id,
          weight: ps.weight,
        })),
      );
    }

    return this.policyRepo.findOne({
      where: { id: policy.id },
      relations: ['policy_stocks', 'policy_stocks.stock'],
    });
  }

  @Patch('policies/:id')
  async updatePolicy(
    @Param('id') id: string,
    @Body() body: { name?: string; policy_stocks?: { stock_id: string; weight: number }[] },
  ) {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);

    if (body.name) policy.name = body.name.trim();
    await this.policyRepo.save(policy);

    if (body.policy_stocks) {
      await this.policyStockRepo.delete({ policy_id: id });
      await this.policyStockRepo.save(
        body.policy_stocks.map((ps) => ({
          policy_id: id,
          stock_id: ps.stock_id,
          weight: ps.weight,
        })),
      );
    }

    return this.policyRepo.findOne({
      where: { id },
      relations: ['policy_stocks', 'policy_stocks.stock'],
    });
  }

  @Delete('policies/:id')
  async deletePolicy(@Param('id') id: string) {
    await this.policyStockRepo.delete({ policy_id: id });
    const result = await this.policyRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Policy ${id} not found`);
    return { deleted: true };
  }

  // ─── Portfolios ────────────────────────────────────────

  @Get('portfolios')
  async listPortfolios() {
    return this.portfolioRepo.find({
      relations: ['customer', 'policy', 'orders'],
      order: { created_at: 'DESC' },
    });
  }

  @Get('portfolios/:id')
  async getPortfolio(@Param('id') id: string) {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id },
      relations: ['customer', 'policy', 'policy.policy_stocks', 'policy.policy_stocks.stock', 'orders', 'orders.order_stocks.stock'],
    });
    if (!portfolio) throw new NotFoundException(`Portfolio ${id} not found`);
    return portfolio;
  }

  // ─── Orders ────────────────────────────────────────────

  @Get('orders')
  async listOrders(@Query('status') status?: string) {
    const where = status ? { status: status as OrderStatus } : {};
    return this.orderRepo.find({
      where,
      relations: ['portfolio', 'portfolio.customer', 'order_stocks.stock'],
      order: { created_at: 'DESC' },
    });
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['portfolio', 'portfolio.customer', 'order_stocks.stock'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(body.status as OrderStatus)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${body.status}`);
    }

    order.status = body.status as OrderStatus;
    return this.orderRepo.save(order);
  }
}
