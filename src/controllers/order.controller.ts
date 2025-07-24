import { Request, Response } from "express"
import { OrderService } from "../services/order.service";
import { Order } from "../entities/order.entity";
import { CreateOrderRequest } from "../types";
import { AppDataSource } from "../config/database";
import { IdempotencyService } from "../services/idempotency.service";
import { IdempotencyRecord } from "../entities/idempotency-record.entity";
import { IdempotentRequest } from "../types";

export class OrderController {
    private orderService: OrderService;
    private idempotencyService: IdempotencyService;

    constructor() {
        this.orderService = new OrderService(AppDataSource.getRepository(Order));
        this.idempotencyService = new IdempotencyService(
            AppDataSource.getRepository(IdempotencyRecord)
        );
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

    createOrderIdempotent = async (req: IdempotentRequest, res: Response) => {
        try {
            const orderData: CreateOrderRequest = req.body;
            const idempotencyKey = req.idempotencyKey!;
            const endpoint = req.route?.path || "/orders";
    
            // Basic validation
            if (
                !orderData.customerEmail ||
                !orderData.productId ||
                !orderData.amount ||
                !orderData.currency
            ) {
                res.status(400).json({
                    error: "VALIDATION_ERROR",
                    message: "Missing required fields in the request body.",
                    statusCode: 400,
                });
    
                return;
            }
    
            // Check for existing idempotency record
            const idempotencyResult =
                await this.idempotencyService.checkIdempotencyKey(
                    idempotencyKey,
                    endpoint,
                    orderData
                );
    
            if (idempotencyResult.isExisting && idempotencyResult.record) {
                // Return the cached response
                const cachedResponse = JSON.parse(
                    idempotencyResult.record.responseData
                );
                res.status(idempotencyResult.record.httpStatusCode).json(
                    cachedResponse
                );
                return;
            }
    
            // Process new request
            const order = await this.orderService.createOrder(orderData);
    
            // Store the idempotency record
            await this.idempotencyService.storeIdempotencyRecord(
                idempotencyKey,
                endpoint,
                orderData,
                order,
                201 // HTTP status code for created
            );
    
            res.status(201).json(order);
        } catch (error) {
            console.error("Error creating order:", error);
    
            if (
                error instanceof Error &&
                error.message.includes("Idempotency key conflict")
            ) {
                const conflictError = {
                    error: "IDEMPOTENCY_CONFLICT",
                    message: error.message,
                    statusCode: 409,
                    originalPayload: {},
                    currentPayload: req.body,
                };
                res.status(409).json(conflictError);
                return;
            }
    
            res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while creating the order.",
                statusCode: 500,
            });
        }
    };

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
