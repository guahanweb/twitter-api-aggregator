import { Command } from '../../command';
import * as dao from '../../../src/dao';
import config from '../../../src/config';
import { logger } from '../../../src/logger';
import { getHourlyCounts } from '../../../src/handlers/report';
import { getPartition } from '../../../src/handlers/utils';

export const init: Command = (program) => {
    const report = program.command('report');
    report
        .description('Report data aggregates for provided time range')
        .option('-i, --include <value>', 'include report', collect, [])
        .action(handleReport);
}

async function handleReport({ include }) {
    if (!include.length) include = ['tweets'];

    await setup();
    // run the reports here
    const partition = getPartition(new Date('2022-05-02 12:00:00'), 11);
    logger.info(`partition: ${partition}`);
    await getHourlyCounts(partition);

    await teardown();
}

async function setup() {
    // any preliminary setup
    await dao.init(config);
}

async function teardown() {
    await dao.done();
}

function collect(value, previous) {
    return previous.concat([value]);
}
