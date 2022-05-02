import config from './config';
import { init, done } from './dao';
import { getHourlyCounts } from './handlers/report';
import { getPartition } from './handlers/utils';

main();
async function main() {
    await init(config);
    const partition = getPartition(new Date('2022-03-13 12:00:00'), 11);

    await getHourlyCounts(partition);
    done();
}
