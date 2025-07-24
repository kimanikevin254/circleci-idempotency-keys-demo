import { Repository } from "typeorm";
import { Order } from "../entities/order.entity";
import { CreateOrderRequest, OrderResponse } from "../types";

export class OrderService {
    constructor(private orderRepository: Repository<Order>) {}

    async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
        const order = this.orderRepository.create({
            customerEmail: orderData.customerEmail,
            productId: orderData.productId,
            amount: orderData.amount,
            currency: orderData.currency,
            status: 'pending',
        })

        const savedOrder = await this.orderRepository.save(order);

        return {
            id: savedOrder.id,
            customerEmail: savedOrder.customerEmail,
            productId: savedOrder.productId,
            amount: savedOrder.amount,
            currency: savedOrder.currency,
            status: savedOrder.status,
            createdAt: savedOrder.createdAt,
        };
    }

    async getOrderById(id: string): Promise<OrderResponse | null> {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) return null;

        return {
            id: order.id,
            customerEmail: order.customerEmail,
            productId: order.productId,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            createdAt: order.createdAt,
        };
    }
}