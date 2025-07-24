import '../setup';
import { AppDataSource } from '../../config/database';
import { IdempotencyService } from '../../services/idempotency.service';
import { IdempotencyRecord } from '../../entities/idempotency-record.entity';

describe('IdempotencyService', () => {
  let idempotencyService: IdempotencyService;
  let idempotencyRepository: any;

  beforeEach(() => {
    idempotencyRepository = AppDataSource.getRepository(IdempotencyRecord);
    idempotencyService = new IdempotencyService(idempotencyRepository);
  });

  describe('checkIdempotencyKey', () => {
    it('should return isExisting: false for new key', async () => {
      const result = await idempotencyService.checkIdempotencyKey(
        'new-key',
        '/orders',
        { test: 'data' }
      );

      expect(result.isExisting).toBe(false);
      expect(result.record).toBeUndefined();
    });

    it('should return existing record for known key with same payload', async () => {
      const key = 'test-key';
      const endpoint = '/orders';
      const payload = { customerEmail: 'test@example.com', amount: 100 };
      const response = { id: '123', status: 'confirmed' };

      // Store a record first
      await idempotencyService.storeIdempotencyRecord(
        key,
        endpoint,
        payload,
        response,
        201
      );

      const result = await idempotencyService.checkIdempotencyKey(key, endpoint, payload);

      expect(result.isExisting).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record!.key).toBe(key);
      expect(result.record!.httpStatusCode).toBe(201);
    });

    it('should throw error for same key with different payload', async () => {
      const key = 'test-key';
      const endpoint = '/orders';
      const originalPayload = { customerEmail: 'test@example.com', amount: 100 };
      const differentPayload = { customerEmail: 'test@example.com', amount: 200 };

      // Store a record first
      await idempotencyService.storeIdempotencyRecord(
        key,
        endpoint,
        originalPayload,
        { id: '123' },
        201
      );

      await expect(
        idempotencyService.checkIdempotencyKey(key, endpoint, differentPayload)
      ).rejects.toThrow('Idempotency key conflict');
    });

    it('should handle expired records by removing them', async () => {
      const key = 'expired-key';
      const endpoint = '/orders';
      const payload = { test: 'data' };

      // Create an expired record manually
      const expiredRecord = idempotencyRepository.create({
        key,
        endpoint,
        requestPayload: JSON.stringify(payload),
        responseData: JSON.stringify({ id: '123' }),
        httpStatusCode: 201,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      await idempotencyRepository.save(expiredRecord);

      const result = await idempotencyService.checkIdempotencyKey(key, endpoint, payload);

      expect(result.isExisting).toBe(false);
      
      // Verify the record was removed
      const recordExists = await idempotencyRepository.findOne({ where: { key } });
      expect(recordExists).toBeNull();
    });
  });

  describe('storeIdempotencyRecord', () => {
    it('should store idempotency record successfully', async () => {
      const key = 'test-key';
      const endpoint = '/orders';
      const payload = { customerEmail: 'test@example.com' };
      const response = { id: '123', status: 'confirmed' };

      await idempotencyService.storeIdempotencyRecord(
        key,
        endpoint,
        payload,
        response,
        201,
        1 // 1 hour expiry
      );

      const storedRecord = await idempotencyRepository.findOne({ where: { key } });

      expect(storedRecord).toBeDefined();
      expect(storedRecord.key).toBe(key);
      expect(storedRecord.endpoint).toBe(endpoint);
      expect(storedRecord.httpStatusCode).toBe(201);
      expect(JSON.parse(storedRecord.requestPayload)).toEqual(payload);
      expect(JSON.parse(storedRecord.responseData)).toEqual(response);
      expect(storedRecord.expiresAt).toBeDefined();
    });
  });

  describe('cleanupExpiredRecords', () => {
    it('should remove expired records and return count', async () => {
      // Create expired and non-expired records
      const expiredRecord1 = idempotencyRepository.create({
        key: 'expired-1',
        endpoint: '/orders',
        requestPayload: '{}',
        responseData: '{}',
        httpStatusCode: 201,
        expiresAt: new Date(Date.now() - 1000),
      });

      const expiredRecord2 = idempotencyRepository.create({
        key: 'expired-2',
        endpoint: '/orders',
        requestPayload: '{}',
        responseData: '{}',
        httpStatusCode: 201,
        expiresAt: new Date(Date.now() - 2000),
      });

      const validRecord = idempotencyRepository.create({
        key: 'valid',
        endpoint: '/orders',
        requestPayload: '{}',
        responseData: '{}',
        httpStatusCode: 201,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });

      await idempotencyRepository.save([expiredRecord1, expiredRecord2, validRecord]);

      const deletedCount = await idempotencyService.cleanupExpiredRecords();

      expect(deletedCount).toBe(2);

      // Verify only valid record remains
      const remainingRecords = await idempotencyRepository.find();
      expect(remainingRecords).toHaveLength(1);
      expect(remainingRecords[0].key).toBe('valid');
    });
  });
});