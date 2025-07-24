import { AppDataSource } from '../../config/database';
import { Order } from '../../entities/order.entity';
import { OrderService } from '../../services/order.service';
import { CreateOrderRequest } from '../../types';
import '../setup';

describe('OrderService', () => {
    let orderService: OrderService;
    let orderRepository: any;

    beforeEach(() => {
        orderRepository = AppDataSource.getRepository(Order);
        orderService = new OrderService(orderRepository);
    });

    describe('createOrder', () => {
        it('should create a new order successfully', async () => {
            const orderData: CreateOrderRequest = {
              customerEmail: 'test@example.com',
              productId: 'prod-123',
              amount: 99.99,
              currency: 'USD',
            };
      
            const result = await orderService.createOrder(orderData);
      
            expect(result).toMatchObject({
              customerEmail: 'test@example.com',
              productId: 'prod-123',
              amount: 99.99,
              currency: 'USD',
              status: 'pending',
            });
            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeDefined();
        });

        it('should save order to database', async () => {
            const orderData: CreateOrderRequest = {
              customerEmail: 'test@example.com',
              productId: 'prod-123',
              amount: 99.99,
              currency: 'USD',
            };
      
            const result = await orderService.createOrder(orderData);
            const savedOrder = await orderRepository.findOne({ where: { id: result.id } });
      
            expect(savedOrder).toBeDefined();
            expect(savedOrder.customerEmail).toBe('test@example.com');
            expect(savedOrder.status).toBe('pending');
          });
    });

    describe('getOrderById', () => {
        it('should return order when found', async () => {
          const orderData: CreateOrderRequest = {
            customerEmail: 'test@example.com',
            productId: 'prod-123',
            amount: 99.99,
            currency: 'USD',
          };
    
          const createdOrder = await orderService.createOrder(orderData);
          const result = await orderService.getOrderById(createdOrder.id);
    
          expect(result).toMatchObject({
            id: createdOrder.id,
            customerEmail: 'test@example.com',
            productId: 'prod-123',
            amount: 99.99,
            currency: 'USD',
            status: 'pending',
          });
        });
    
        it('should return null when order not found', async () => {
          const result = await orderService.getOrderById('non-existent-id');
          expect(result).toBeNull();
        });
    });
});