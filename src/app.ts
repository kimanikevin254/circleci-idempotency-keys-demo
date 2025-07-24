import 'reflect-metadata';
import express from 'express';
import { orderRoutes } from './routes/order.routes';

export const createApp = (): express.Application => {
    const app = express();

    // Middleware
    app.use(express.json());

    // Routes
    app.use('/api/v1', orderRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('Unhandled error:', err);
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.',
            statusCode: 500
        });
    });

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'NOT_FOUND',
            message: `Route ${req.method} ${req.baseUrl} not found`,
            statusCode: 404
        });
    });

    return app;
}