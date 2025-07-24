import { Request } from "express";
import { IdempotencyRecord } from "../entities/idempotency-record.entity";

export interface CreateOrderRequest {
    customerEmail: string;
    productId: string;
    amount: number;
    currency: string;
}

export interface OrderResponse {
    id: string;
    customerEmail: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
}

export interface IdempotencyKeyHeader {
    'idempotency-key'?: string;
}

export interface APIError {
    error: string;
    message: string;
    statusCode: number;
}

export interface IdempotencyConflictError extends APIError {
    error: 'IDEMPOTENCY_CONFLICT';
    message: string;
    originalPayload: any;
    currentPayload: any;
}

export interface IdempotencyResult {
    isExisting: boolean;
    record?: IdempotencyRecord;
}

export interface IdempotentRequest extends Request {
    idempotencyKey?: string;
}