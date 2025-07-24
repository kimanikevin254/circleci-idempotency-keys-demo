import { Entity, PrimaryColumn } from "typeorm";

@Entity('idempotency_records')
export class IdempotencyRecord {
    @PrimaryColumn({ unique: true })
    key: string;

    // Other properties will be added here
}