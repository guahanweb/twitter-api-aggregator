import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
    path: path.resolve(__dirname, '../.env'),
});

export interface AppConfig {
    logLevel: string;

    apiKey: string | null;
    apiSecret: string | null;
    bearerToken: string | null;

    redisHost: string | null;
    redisPort: string | null;
    redisPass?: string | null;

}

const init = function(): AppConfig {
    return {
        logLevel: loadFromEnv('LOG_LEVEL', 'info'),

        apiKey: loadFromEnv('API_KEY'),
        apiSecret: loadFromEnv('API_KEY_SECRET'),
        bearerToken: loadFromEnv('BEARER_TOKEN'),

        redisHost: loadFromEnv('REDIS_HOST', 'localhost'),
        redisPort: loadFromEnv('REDIS_PORT', 6379),
        redisPass: loadFromEnv('REDIS_PASS'),
    };
}

export default init();

function loadFromEnv(key: string, defaultValue: any = null) {
    const value = process.env && process.env[key];
    return value || defaultValue;
}
