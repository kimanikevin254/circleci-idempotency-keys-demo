import "reflect-metadata"
import { DataSource } from "typeorm"
import { Order } from "../entities/order.entity"
import { IdempotencyRecord } from "../entities/idempotency-record.entity"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: process.env.NODE_ENV === "test" ? ":memory:" : "database.sqlite",
    synchronize: true,
    logging: process.env.NODE_ENV !== "test",
    entities: [Order, IdempotencyRecord],
    migrations: [],
    subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Error during database initialization:", error);
        throw error;
    }
}

export const closeDataSource = async (): Promise<void> => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log("Database connection closed successfully.");
    }
};

export const closeDatabase = async (): Promise<void> => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
};