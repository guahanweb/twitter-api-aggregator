import config from './config';
import { logger } from './logger';
import { init, done } from './dao';
import { getHourlyCounts } from './handlers/report';
import { getPartition } from './handlers/utils';

main();
async function main() {
    await init(config);
    const partition = getPartition(new Date('2022-03-13 12:00:00'), 11);

    const authors = await getHourlyCounts(partition);
    logger.info('author summary:', { authors });
    done();
}
