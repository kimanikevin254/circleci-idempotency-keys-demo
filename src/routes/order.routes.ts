import { Router } from "express";
import { OrderController } from "../controllers/order.controller";

const router = Router();
const orderController = new OrderController();

// Non-idempotent endpoint (demonstrates the problem)
router.post('/orders/non-idempotent', orderController.createOrderNonIdempotent);

// Get order by ID
router.get('/orders/:id', orderController.getOrder);

export { router as orderRoutes };