import Redis from 'ioredis';

const redis = new Redis({
  host: 'redis-10198.c89.us-east-1-3.ec2.redns.redis-cloud.com',
  port: 10198,
  username: 'default',
  password: 'd7cLaXOLjPOSRb4GlxJldxaG1KaWOsMS',
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false
});

redis.on('error', err => console.log('Redis Client Error', err));
redis.on('connect', async () => {
  console.log('Redis conectado');
  try {
    await redis.config('SET', 'maxmemory-policy', 'noeviction');
    console.log('Redis eviction policy configurada para noeviction');
  } catch (error) {
    console.log('Aviso: Não foi possível alterar eviction policy (pode ser limitação do Redis Cloud)');
  }
});

export { redis };