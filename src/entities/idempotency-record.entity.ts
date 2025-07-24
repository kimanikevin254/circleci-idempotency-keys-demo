import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("idempotency_records")
export class IdempotencyRecord {
    @PrimaryColumn({ unique: true })
    key: string;

    @Column("text")
    requestPayload: string;

    @Column("text")
    responseData: string;

    @Column()
    httpStatusCode: number;

    @Column()
    endpoint: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true, type: "datetime" })
    expiresAt: Date;
}