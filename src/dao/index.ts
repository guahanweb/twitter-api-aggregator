import { RedisClientType } from '@node-redis/client';
import { RedisClientOptions } from "redis";
import redis = require('redis');
import { logger } from '../logger';

let client: RedisClientType;
export async function init({ redisHost, redisPort }: any) {
    logger.info('connecting to redis...', { redisHost, redisPort });
    client = redis.createClient({
        url: `redis://${redisHost}:${redisPort}`,
    } as RedisClientOptions);

    client.on('error', (err) => logger.error(`redis error: ${err.message}`, { err }));
    await client.connect();
}

export function getClient() {
    if (!client) {
        throw new Error('Redis client not yet initialized');
    }
    return client;
}

export async function done(): Promise<void> {
    await client.disconnect();
}
