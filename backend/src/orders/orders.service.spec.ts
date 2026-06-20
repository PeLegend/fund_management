import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './order.entity';
import { OrderStock } from './order-stock.entity';
import { Portfolio } from '../portfolios/portfolio.entity';
import { PolicyStock } from '../policies/policy-stock.entity';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let orderStockRepo: jest.Mocked<Repository<OrderStock>>;
  let portfolioRepo: jest.Mocked<Repository<Portfolio>>;
  let policyStockRepo: jest.Mocked<Repository<PolicyStock>>;

  beforeEach(async () => {
    const mockOrderRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockOrderStockRepo = {
      save: jest.fn(),
    };

    const mockPortfolioRepo = {
      findOne: jest.fn(),
    };

    const mockPolicyStockRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderStock), useValue: mockOrderStockRepo },
        { provide: getRepositoryToken(Portfolio), useValue: mockPortfolioRepo },
        { provide: getRepositoryToken(PolicyStock), useValue: mockPolicyStockRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get(getRepositoryToken(Order));
    orderStockRepo = module.get(getRepositoryToken(OrderStock));
    portfolioRepo = module.get(getRepositoryToken(Portfolio));
    policyStockRepo = module.get(getRepositoryToken(PolicyStock));
  });

  describe('create - duplicate order prevention', () => {
    it('should throw ConflictException when PENDING order exists', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        portfolio_code: 'P001',
        policy: {
          id: 'policy-1',
          policy_stocks: [
            { stock_id: 'stock-1', weight: 40 },
            { stock_id: 'stock-2', weight: 60 },
          ],
        },
      };

      portfolioRepo.findOne.mockResolvedValue(mockPortfolio as any);
      orderRepo.findOne.mockResolvedValue({
        id: 'existing-order',
        status: OrderStatus.PENDING,
      } as any);

      await expect(
        service.create({ portfolio_code: 'P001', amount: 100000 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when PROCESSING order exists', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        portfolio_code: 'P001',
        policy: {
          id: 'policy-1',
          policy_stocks: [
            { stock_id: 'stock-1', weight: 40 },
            { stock_id: 'stock-2', weight: 60 },
          ],
        },
      };

      portfolioRepo.findOne.mockResolvedValue(mockPortfolio as any);
      orderRepo.findOne.mockResolvedValue({
        id: 'existing-order',
        status: OrderStatus.PROCESSING,
      } as any);

      await expect(
        service.create({ portfolio_code: 'P001', amount: 100000 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create order when no active order exists', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        portfolio_code: 'P001',
        policy: {
          id: 'policy-1',
          policy_stocks: [
            { stock_id: 'stock-1', weight: 40 },
            { stock_id: 'stock-2', weight: 60 },
          ],
        },
      };

      portfolioRepo.findOne.mockResolvedValue(mockPortfolio as any);
      orderRepo.findOne.mockResolvedValue(null);
      orderRepo.count.mockResolvedValue(0);
      orderRepo.create.mockReturnValue({
        id: 'new-order',
        order_code: 'O001',
        portfolio_id: 'portfolio-1',
        amount: 100000,
        status: OrderStatus.PENDING,
      } as any);
      orderRepo.save.mockResolvedValue({
        id: 'new-order',
        order_code: 'O001',
        portfolio_id: 'portfolio-1',
        amount: 100000,
        status: OrderStatus.PENDING,
      } as any);

      // Mock the findByCode call at the end
      orderRepo.findOne
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce({    // findByCode at end
          id: 'new-order',
          order_code: 'O001',
          portfolio_id: 'portfolio-1',
          amount: 100000,
          status: OrderStatus.PENDING,
          order_stocks: [],
          portfolio: mockPortfolio,
        } as any);

      orderStockRepo.save.mockResolvedValue([] as any);

      const result = await service.create({ portfolio_code: 'P001', amount: 100000 });
      expect(result.order_code).toBe('O001');
      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('cancel', () => {
    it('should cancel PENDING order', async () => {
      orderRepo.findOne
        .mockResolvedValueOnce({
          id: 'order-1',
          order_code: 'O001',
          status: OrderStatus.PENDING,
        } as any)
        .mockResolvedValueOnce({
          id: 'order-1',
          order_code: 'O001',
          status: OrderStatus.FAILED,
          order_stocks: [],
        } as any);

      orderRepo.save.mockResolvedValue({
        id: 'order-1',
        order_code: 'O001',
        status: OrderStatus.FAILED,
      } as any);

      const result = await service.cancel('O001');
      expect(result.status).toBe(OrderStatus.FAILED);
    });

    it('should throw BadRequestException when cancelling non-PENDING order', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        order_code: 'O001',
        status: OrderStatus.PROCESSING,
      } as any);

      await expect(service.cancel('O001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should validate status transitions', async () => {
      orderRepo.findOne
        .mockResolvedValueOnce({
          id: 'order-1',
          order_code: 'O001',
          status: OrderStatus.PENDING,
        } as any)
        .mockResolvedValueOnce({
          id: 'order-1',
          order_code: 'O001',
          status: OrderStatus.PROCESSING,
          order_stocks: [],
        } as any);

      orderRepo.save.mockResolvedValue({
        id: 'order-1',
        order_code: 'O001',
        status: OrderStatus.PROCESSING,
      } as any);

      const result = await service.updateStatus('O001', { status: 'PROCESSING' });
      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        order_code: 'O001',
        status: OrderStatus.COMPLETED,
      } as any);

      await expect(
        service.updateStatus('O001', { status: 'PENDING' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
