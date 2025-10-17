import mongoose from 'mongoose';

export interface IOrder {
  id: string;
  cliente: string;
  valor: number;
  tier: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';
  priority: 'VIP' | 'NORMAL';
  observacoes: string;
  processedAt?: Date;
}

export interface IOrder {
  id: string
}
const orderSchema = new mongoose.Schema<IOrder>({
  id: { type: String, required: true, unique: true },
  cliente: { type: String, required: true },
  valor: { type: Number, required: true },
  tier: { type: String, enum: ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE'], required: true },
  priority: { type: String, enum: ['VIP', 'NORMAL'], required: true },
  observacoes: { type: String, required: true },
  processedAt: { type: Date }
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', orderSchema);