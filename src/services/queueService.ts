import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { Order } from '../models/Order';
import { logService } from './logService';

export const vipQueue = new Queue('vip-orders', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 5,
    attempts: 1
  }
});

export const normalQueue = new Queue('normal-orders', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 5,
    attempts: 1
  }
});

export const processStats = {
  vipStartTime: null as Date | null,
  vipEndTime: null as Date | null,
  normalStartTime: null as Date | null,
  normalEndTime: null as Date | null,
  vipProcessed: 0,
  normalProcessed: 0,
  vipGenerated: 0,
  normalGenerated: 0,
  vipInQueue: 0,
  normalInQueue: 0,
  generationTime: 0,
  totalStartTime: null as Date | null
};

const vipWorker = new Worker('vip-orders', async (job) => {
  if (!processStats.vipStartTime) {
    processStats.vipStartTime = new Date();
    logService.addLog('🚀 Iniciando processamento de pedidos VIP...', 'processing');
  }
  
  const { orderId } = job.data;
  
  await Order.findOneAndUpdate(
    { id: orderId },
    { 
      observacoes: 'enviado com prioridade',
      processedAt: new Date()
    }
  );
  
  processStats.vipProcessed++;
  
  if (processStats.vipProcessed % 500 === 0) {
    logService.addLog(`✅ ${processStats.vipProcessed} pedidos VIP processados...`, 'processing');
  }
}, { 
  connection: redis,
  concurrency: 10
});

const normalWorker = new Worker('normal-orders', async (job) => {
  if (!processStats.normalStartTime) {
    processStats.normalStartTime = new Date();
    logService.addLog('🚀 Iniciando processamento de pedidos NORMAIS...', 'processing');
  }
  
  const { orderId } = job.data;
  
  await Order.findOneAndUpdate(
    { id: orderId },
    { 
      observacoes: 'processado sem prioridade',
      processedAt: new Date()
    }
  );
  
  processStats.normalProcessed++;
  
  if (processStats.normalProcessed % 1000 === 0) {
    logService.addLog(`✅ ${processStats.normalProcessed} pedidos NORMAIS processados...`, 'processing');
  }
}, { 
  connection: redis,
  concurrency: 10
});

vipWorker.on('completed', async () => {
  const vipCount = await vipQueue.count();
  if (vipCount === 0) {
    processStats.vipEndTime = new Date();
    logService.addLog('🎆 TODOS OS PEDIDOS VIP PROCESSADOS!', 'processing');
  }
});

normalWorker.on('completed', async () => {
  const normalCount = await normalQueue.count();
  if (normalCount === 0) {
    processStats.normalEndTime = new Date();
    logService.addLog('🎆 TODOS OS PEDIDOS NORMAIS PROCESSADOS!', 'processing');
  }
});

export { vipWorker, normalWorker };