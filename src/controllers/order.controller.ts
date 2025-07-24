import { Request, Response } from "express"
import { OrderService } from "../services/order.service";
import { Order } from "../entities/order.entity";
import { CreateOrderRequest } from "../types";
import { AppDataSource } from "../config/database";

export class OrderController {
    private orderService: OrderService;

    constructor() {
        this.orderService = new OrderService(AppDataSource.getRepository(Order));
    }

    // Non-idempotent endpoint (demonstrates the problem)
    createOrderNonIdempotent = async (req: Request, res: Response) => {
        try {
            const orderData: CreateOrderRequest = req.body;

            // Basic validation
            if (!orderData.customerEmail || !orderData.productId || !orderData.amount || !orderData.currency) {
                res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Missing required fields in the request body.',
                    statusCode: 400
                });

                return;
            }

            const order = await this.orderService.createOrder(orderData);
            res.status(201).json(order);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'An error occurred while creating the order.',
                statusCode: 500
            });
        }
    }

    getOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const order = await this.orderService.getOrderById(id);

            if (!order) {
                res.status(404).json({
                    error: 'ORDER_NOT_FOUND',
                    message: `Order with ID ${id} not found.`,
                    statusCode: 404
                });
                return;
            }

            res.status(200).json(order);
        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'An error occurred while fetching the order.',
                statusCode: 500
            });
        }
    }
}
