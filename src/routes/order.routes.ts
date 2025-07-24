import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { validateIdempotencyKey } from "../middleware/idempotency.middleware";

const router = Router();
const orderController = new OrderController();

// Non-idempotent endpoint (demonstrates the problem)
router.post('/orders/non-idempotent', orderController.createOrderNonIdempotent);

// Idempotent endpoint (the solution)
router.post(
    "/orders",
    validateIdempotencyKey(true),
    orderController.createOrderIdempotent
);

// Get order by ID
router.get('/orders/:id', orderController.getOrder);

export { router as orderRoutes };