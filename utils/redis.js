import redis from 'redis';

class RedisClient {
    constructor() {
        this.client = redis.createClient();
        this.isClientConnected = true;
        this.client.on('error', (error) => {
            console.error(error);
        });

        this.client.on('connect', () => {
            this.isClientConnected = true;
        });
    }

    isAlive() {
        return this.isClientConnected;
    }

    async get(key) {
        const value = await this.getAsync(key);
        return value;
    }

    async set(key, value, duration) {
        await this.setAsync(key, value, 'EX', duration);
    }

    async del(key) {
        await this.delAsync(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;