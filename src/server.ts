import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import orderRouter from './routers/order';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

connectDB();

app.use('/api', orderRouter);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema de Processamento de Pedidos H&W Publishing',
    endpoints: {
      'GET /api/pedidos': 'Status dos pedidos processados',
      'POST /api/executar': 'Executar geração e processamento',
      'POST /api/reset': 'Resetar banco de dados'
    }
  });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});