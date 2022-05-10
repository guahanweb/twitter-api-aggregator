import config from './config';
import needle from 'needle';
import { logger } from './logger';
import {
    filterFields,
    filterUserFields,
    filterExpansions,
    analyze
} from './analyzer';
import * as dao from './dao';

const streamURL = 'https://api.twitter.com/2/tweets/search/stream';

main();
async function main() {
    await dao.init(config); // connect to data store
    connect(); // connect to twitter
}

function connect(retryAttempt = 0) {
    const query = [
        'tweet.fields=' + filterFields().join(','),
        'user.fields=' + filterUserFields().join(','),
        'expansions=' + filterExpansions().join(','),
    ].join('&');

    const stream = needle.get(streamURL + `?${query}`, {
        headers: {
            'User-Agent': 'OpenSourceMonitorApp',
            'Authorization': `Bearer ${config.bearerToken}`,
        },
        timeout: 20000,
    });

    stream.on('data', data => {
        try {
            // we just run a general analyzer utility in order
            // to control sorting and aggregation elsewhere
            const json = JSON.parse(data);
            analyze(json);
            retryAttempt = 0;
        } catch (e) {
            if (data.detail === 'This stream is currently at the maximum allowed connection limit.') {
                // if we get max connections, destroy the current connection
                // then retry after 1 minute
                logger.error(`twitter error: ${data.detail}`);
                (stream as any).destroy();
                setTimeout(() => {
                    logger.info(`attempting to reestablish connection`);
                    connect();
                }, 60000);
            } else {
                // keep alive signal received. do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            logger.error(`twitter error: ${error.message}`, { err: error });
            process.exit(1);
        } else {
            // reconnect with exponential backoff
            setTimeout(() => {
                logger.warn('twitter connection error; reconnecting...', { retryAttempt });
                (stream as any).destroy();
                connect(retryAttempt++);
            }, 2 ** retryAttempt);
        }
    });

    return stream;
}
