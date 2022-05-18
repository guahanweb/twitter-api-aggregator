import config from '../config';
import * as dao from '../dao';
import { logger } from '../logger';
import { default as express, Express } from 'express';
import initializeRoutes from './routes';

// if invoked directly, execute
if (require.main === module) {
    main()
        .then((app: Express) => {
            app.listen({ port: config.server.port });
            logger.info('server is listening');
        })
        .catch(err => {
            logger.error(err);
            process.exit(1);
        });
}

async function main(): Promise<Express> {
    const app = express();
    await bootstrap();
    initializeRoutes(app);
    return app;
}

async function bootstrap() {
    await dao.init(config); // data store
}