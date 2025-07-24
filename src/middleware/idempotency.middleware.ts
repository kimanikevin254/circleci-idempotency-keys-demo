import { Response, NextFunction } from "express";
import { validate as isUuid } from "uuid";
import { IdempotentRequest } from "../types";

export const validateIdempotencyKey = (required: boolean = true) => {
    return (req: IdempotentRequest, res: Response, next: NextFunction) => {
        const idempotencyKey = req.headers["idempotency-key"] as string;

        if (required && !idempotencyKey) {
            return res.status(400).json({
                error: "MISSING_IDEMPOTENCY_KEY",
                message:
                    "Idempotency-Key header is required for this endpoint.",
                statusCode: 400,
            });
        }

        if (idempotencyKey) {
            // Ensure idempotency key is a valid UUID
            if (!isUuid(idempotencyKey)) {
                return res.status(400).json({
                    error: "INVALID_IDEMPOTENCY_KEY",
                    message: "idempotency-key header must be a valid UUID.",
                    statusCode: 400,
                });
            }

            req.idempotencyKey = idempotencyKey;
        }

        next();
    };
};