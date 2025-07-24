import { Repository } from "typeorm";
import { IdempotencyRecord } from "../entities/idempotency-record.entity";
import { IdempotencyResult } from "../types";
import { createHash } from "crypto";

export class IdempotencyService {
    private readonly DEFAULT_EXPIRY_HOURS = 24;

    constructor(private idempotencyRepository: Repository<IdempotencyRecord>) {}

    private hashPayload(payload: any): string {
        const normalizedPayload = JSON.stringify(
            payload,
            Object.keys(payload).sort()
        );
        return createHash("sha256").update(normalizedPayload).digest("hex");
    }

    async checkIdempotencyKey(
        key: string,
        endpoint: string,
        payload: any
    ): Promise<IdempotencyResult> {
        const existingRecord = await this.idempotencyRepository.findOne({
            where: { key },
        });

        if (!existingRecord) {
            return { isExisting: false };
        }

        // Check if the record has expired
        if (existingRecord.expiresAt && new Date() > existingRecord.expiresAt) {
            await this.idempotencyRepository.remove(existingRecord);
            return { isExisting: false };
        }

        // Compare the payloads
        const currentPayloadHash = this.hashPayload(payload);
        const originalPayloadHash = this.hashPayload(
            JSON.parse(existingRecord.requestPayload)
        );

        if (currentPayloadHash !== originalPayloadHash) {
            throw new Error(
                `Idempotency key conflict: The same key was used with different payload data. ` +
                    `Original payload: ${
                        existingRecord.requestPayload
                    }, Current payload: ${JSON.stringify(payload)}`
            );
        }

        return { isExisting: true, record: existingRecord };
    }

    async storeIdempotencyRecord(
        key: string,
        endpoint: string,
        requestPayload: any,
        responseData: any,
        httpStatusCode: number,
        expiryHours: number = this.DEFAULT_EXPIRY_HOURS
    ): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiryHours);

        const record = this.idempotencyRepository.create({
            key,
            requestPayload: JSON.stringify(requestPayload),
            responseData: JSON.stringify(responseData),
            httpStatusCode,
            endpoint,
            expiresAt,
        });

        await this.idempotencyRepository.save(record);
    }
}