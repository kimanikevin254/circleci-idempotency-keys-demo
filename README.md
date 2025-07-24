# Building Safer APIs with Idempotency Keys

A TypeScript demo application showing how to implement idempotency keys to make APIs safer and more reliable.

## Project Structure

```
src/
├── __tests__/                        # Unit tests
│   ├── setup.ts                      # Test configuration
│   ├── services/                     # Service layer tests
├── config/                           # Configuration files
│   └── database.ts                   # TypeORM database configuration
├── controllers/                      # Request handlers
│   └── order.controller.ts           # Order-related endpoints
├── entities/                         # TypeORM entities
│   ├── order.entity.ts               # Order entity
│   └── idempotency-record.entity.ts  # Idempotency tracking entity
├── middleware/                       # Express middleware
│   └── idempotency.middleware.ts     # Idempotency key validation
├── routes/                           # API routes
│   └── order.routes.ts               # Order endpoints
├── services/                         # Business logic
│   ├── order.service.ts              # Order operations
│   └── idempotency.service.ts        # Idempotency management
├── types/                            # TypeScript type definitions
│   └── index.ts                      # Shared types
├── app.ts                            # Express app configuration
└── index.ts                          # Application entry point
```

## Key Features

### Non-Idempotent Endpoint

-   `POST /api/v1/orders/non-idempotent` - Demonstrates the problem
-   Multiple identical requests create duplicate orders

### Idempotent Endpoint

-   `POST /api/v1/orders` - The solution
-   Requires `Idempotency-Key` header (UUID format)
-   Prevents duplicate operations
-   Returns cached responses for repeat requests
-   Detects payload conflicts

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm or yarn

### Installation

```bash
npm install
```

### Running the Application

```bash
# Development mode
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Create Order (Non-Idempotent)

```bash
curl -X POST http://localhost:3000/api/v1/orders/non-idempotent \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "productId": "prod-123",
    "amount": 99.99,
    "currency": "USD"
  }'
```

### Create Order (Idempotent)

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "customerEmail": "test@example.com",
    "productId": "prod-123",
    "amount": 99.99,
    "currency": "USD"
  }'
```

### Get Order

```bash
curl http://localhost:3000/api/v1/orders/{order-id}
```

## Testing Idempotency

### Same Request Twice

First request creates an order:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "productId": "prod-123", "amount": 99.99, "currency": "USD"}'
```

Second request returns the saved response:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "productId": "prod-123", "amount": 99.99, "currency": "USD"}'
```

### Payload Conflict

First request:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "productId": "prod-123", "amount": 99.99, "currency": "USD"}'
```

Second request with different payload (and the same idempotency key) returns `409 Conflict`:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "productId": "prod-123", "amount": 199.99, "currency": "USD"}'
```

## CI/CD with CircleCI

The project includes CircleCI configuration for:

-   Automated testing on every push

## Technologies Used

-   **TypeScript** - Type-safe JavaScript
-   **Express.js** - Web framework
-   **TypeORM** - Object-Relational Mapping
-   **SQLite** - Database (in-memory for tests)
-   **Jest** - Testing framework
-   **Supertest** - HTTP assertion library
-   **CircleCI** - Continuous Integration
