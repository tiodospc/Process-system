import express from 'express';
import { generateOrders, processOrders, resetDatabase, processStats } from '../services/orderService';
import { logService } from '../services/logService';
import { Order } from '../models/Order';

const router = express.Router();

router.get('/pedidos', async (req, res) => {
  try {
    const vipCount = await Order.countDocuments({ priority: 'VIP', processedAt: { $exists: true } });
    const normalCount = await Order.countDocuments({ priority: 'NORMAL', processedAt: { $exists: true } });
    const totalOrders = await Order.countDocuments({});
    
    const totalTime = processStats.totalStartTime ? 
      Date.now() - processStats.totalStartTime.getTime() : 0;
    
    const vipProcessingTime = processStats.vipStartTime && processStats.vipEndTime ?
      processStats.vipEndTime.getTime() - processStats.vipStartTime.getTime() : 0;
    
    const normalProcessingTime = processStats.normalStartTime && processStats.normalEndTime ?
      processStats.normalEndTime.getTime() - processStats.normalStartTime.getTime() : 0;

    res.json({
      tempoGeracaoPedidos: `${processStats.generationTime}ms`,
      tempoProcessamentoVIP: `${vipProcessingTime}ms`,
      tempoProcessamentoNormal: `${normalProcessingTime}ms`,
      horarioInicioVIP: processStats.vipStartTime,
      horarioFimVIP: processStats.vipEndTime,
      horarioInicioNormal: processStats.normalStartTime,
      horarioFimNormal: processStats.normalEndTime,
      tempoTotalExecucao: `${totalTime}ms`,
      quantidadePedidosVIP: vipCount,
      quantidadePedidosNormal: normalCount,
      totalPedidosGerados: totalOrders,
      vipGerados: processStats.vipGenerated,
      normalGerados: processStats.normalGenerated,
      vipProcessados: processStats.vipProcessed,
      normalProcessados: processStats.normalProcessed,
      vipNaFila: processStats.vipInQueue,
      normalNaFila: processStats.normalInQueue
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados dos pedidos' });
  }
});

router.get('/logs', (req, res) => {
  try {
    const logs = logService.getLogs();
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

router.post('/executar', async (req, res) => {
  try {
    res.json({ message: 'Processamento iniciado com sucesso' });
    
   (async () => {
      try {
        await generateOrders();
        await processOrders();
        console.log('Processamento completo!');
      } catch (error) {
        console.error('Erro no processamento:', error);
      }
    })();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao executar processamento' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    await resetDatabase();
    res.json({ message: 'Banco de dados resetado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar banco de dados' });
  }
});

export default router;