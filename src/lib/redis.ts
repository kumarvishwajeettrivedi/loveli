import Redis from 'redis';

let redisClient: Redis.RedisClientType | null = null;

export async function getRedisClient(): Promise<Redis.RedisClientType> {
  if (!redisClient) {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Redis Client Connected'));

    await redisClient.connect();
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default getRedisClient;
