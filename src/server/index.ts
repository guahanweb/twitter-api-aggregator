import config from '../config';
import * as dao from '../dao';
import path from 'path';
import { logger } from '../logger';
import { default as express, Express } from 'express';
import { engine } from 'express-handlebars';
import initializeRoutes from './routes';
import * as helpers from './handlebars-helpers';

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
    await bootstrap();

    const app = express();

    app.engine('handlebars', engine({ helpers }));
    app.set('view engine', 'handlebars');
    app.set('views', path.resolve(__dirname, 'views'));

    initializeRoutes(app);
    return app;
}

async function bootstrap() {
    await dao.init(config); // data store
}