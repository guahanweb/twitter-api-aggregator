import * as path from 'path';
import * as fs from 'fs';
import { getClient } from '../dao';
import { logger } from '../logger';

export async function getHourlyCounts(partition: string) {
    const script = fs.readFileSync(path.resolve(__dirname, 'scripts/hourly.sum.lua')).toString();
    const client = getClient();

    const result: any = await client.EVAL(script, {
        keys: [
            `${partition}:authors`,
            `${partition}:tweeted:authors`,
            `${partition}:retweeted:authors`,
            `${partition}:quoted:authors`,
            `${partition}:replied_to:authors`,
        ],
        arguments: [
            '20',
        ]
    });

    let authors = {};
    for (let i = 0; i < result.length; i += 2) {
        const username: any = await client.HGET(`user:${result[i]}`, 'username');
        authors[username] = result[i+1];
    }

    logger.info('author summary:', { authors });
}

export async function getWeightedTags(partition: string) {
    const script = fs.readFileSync(path.resolve(__dirname, 'scripts/hourly.tags.lua')).toString();
    const client = getClient();

    const aggregateKeys = [
        `${partition}:tweeted:tags`,
        `${partition}:retweeted:tags`,
        `${partition}:quoted:tags`,
        `${partition}:replied_to:tags`,
    ];

    const result = client.EVAL(script, {
        keys: [
            `${partition}:tags`,
            ...aggregateKeys,
        ]
    });
    return result;
}