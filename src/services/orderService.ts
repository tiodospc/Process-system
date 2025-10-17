import { Order } from '../models/Order';
import { vipQueue, normalQueue, processStats } from './queueService';
import { logService } from './logService';

export const generateOrders = async (): Promise<void> => {
  const startTime = Date.now();
  processStats.totalStartTime = new Date();
  
  // Reset counters
  processStats.vipGenerated = 0;
  processStats.normalGenerated = 0;
  
  await Order.deleteMany({});
  logService.addLog('Banco limpo. Iniciando geração de 100.000 pedidos...', 'generation');
  
  const orders = [];
  const tiers = ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE'];
  
  for (let i = 1; i <= 100000; i++) {
    const tier = tiers[Math.floor(Math.random() * tiers.length)] as any;
    const priority = tier === 'DIAMANTE' ? 'VIP' : 'NORMAL';
    
    // Count generated orders by priority
    if (priority === 'VIP') {
      processStats.vipGenerated++;
    } else {
      processStats.normalGenerated++;
    }
    
    orders.push({
      id: `ORDER_${Date.now()}_${i}`,
      cliente: `Cliente_${Math.floor(Math.random() * 100000)}`,
      valor: Math.floor(Math.random() * 10000) + 100,
      tier,
      priority,
      observacoes: 'Pedido gerado'
    });
    
    if (orders.length === 10000) {
      await Order.insertMany(orders);
      orders.length = 0;
      logService.addLog(`📦 ${i} pedidos gerados (${Math.round((i/100000)*100)}% concluído) - VIP: ${processStats.vipGenerated}, Normal: ${processStats.normalGenerated}`, 'generation');
    }
  }
  
  if (orders.length > 0) {
    await Order.insertMany(orders);
  }
  
  processStats.generationTime = Date.now() - startTime;
  logService.addLog(`✅ 100.000 pedidos gerados em ${processStats.generationTime}ms - VIP: ${processStats.vipGenerated}, Normal: ${processStats.normalGenerated}`, 'generation');
};

export const processOrders = async (): Promise<void> => {
  logService.addLog('Iniciando processamento de pedidos...', 'processing');
  
  await vipQueue.drain();
  await normalQueue.drain();
  
  const vipOrders = await Order.find({ priority: 'VIP' });
  const normalOrders = await Order.find({ priority: 'NORMAL' });
  
  // Processar TODOS os VIP de uma vez
  logService.addLog(`📦 Adicionando TODOS os ${vipOrders.length} pedidos VIP à fila...`, 'processing');
  
  // Adicionar todos os VIP de uma vez
  const vipJobs = vipOrders.map(order => ({ name: 'process-vip', data: { orderId: order.id } }));
  await vipQueue.addBulk(vipJobs);
  
  logService.addLog(`✅ ${vipOrders.length} pedidos VIP adicionados à fila. Processando...`, 'processing');
  
  // Aguardar processamento de TODOS os VIP
  while ((await vipQueue.count()) > 0) {
    processStats.vipInQueue = await vipQueue.count();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  processStats.vipInQueue = 0;
  logService.addLog('✅ Todos os pedidos VIP foram processados!', 'processing');
  
  // Processar TODOS os Normal de uma vez
  logService.addLog(`📦 Adicionando TODOS os ${normalOrders.length} pedidos NORMAIS à fila...`, 'processing');
  
  // Adicionar todos os Normal de uma vez
  const normalJobs = normalOrders.map(order => ({ name: 'process-normal', data: { orderId: order.id } }));
  await normalQueue.addBulk(normalJobs);
  
  logService.addLog(`✅ ${normalOrders.length} pedidos NORMAIS adicionados à fila. Processando...`, 'processing');
  
  // Aguardar processamento de TODOS os Normal
  while ((await normalQueue.count()) > 0) {
    processStats.normalInQueue = await normalQueue.count();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  processStats.normalInQueue = 0;
  
  logService.addLog('✅ Todos os pedidos NORMAIS foram processados!', 'processing');
  logService.addLog('🎉 PROCESSAMENTO COMPLETO! Todos os pedidos foram processados!', 'processing');
};

export const resetDatabase = async (): Promise<void> => {
  const totalOrders = await Order.countDocuments({});
  await Order.deleteMany({});
  await vipQueue.drain();
  await normalQueue.drain();
  
  Object.assign(processStats, {
    vipStartTime: null,
    vipEndTime: null,
    normalStartTime: null,
    normalEndTime: null,
    vipProcessed: 0,
    normalProcessed: 0,
    generationTime: 0,
    totalStartTime: null
  });
  
  logService.addLog(`🗑️ Banco de dados resetado - ${totalOrders} pedidos removidos`, 'reset');
};

export { processStats };