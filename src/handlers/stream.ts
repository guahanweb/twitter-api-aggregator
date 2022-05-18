import { logger } from '../logger';
import {
    ExpandedUser,
    TweetEntitities,
} from '../twitter';
import { getPartitionRoot } from './utils';
import { getClient } from '../dao';

const types = [
    'tweeted',
    'retweeted',
    'quoted',
    'replied_to',
]

export async function handler(payload) {
    const client = getClient();
    const partition = getPartitionRoot();
    
    const { data, includes } = payload;
    const { referenced_tweets } = data || {};

    const author = getAuthor(data?.author_id, includes?.users);
    const { tags, mentions, urls } = parseEntities(data.entities);

    let index = 0; // default to 'tweeted'
    let reference = null;
    if (referenced_tweets && referenced_tweets.length) {
        const tweet = referenced_tweets[0];
        index = types.indexOf(tweet.type);
        reference = tweet.id;
        index = index < 0 ? 0 : index;
    }

    const type = types[index];
    const event = `${partition}:${type}`;
    logger.info('twitter event', { partition, type });

    // counts all the original posts
    const author_id = data?.author_id || 'unknown';

    let chain = client.multi()
        .ZADD(`${event}:authors`, { score: 1, value: author_id}, { INCR: true });

    if (author !== null) {
        const username = author?.username;
        const followers_count = author?.public_metrics?.followers_count;
        const listed_count = author?.public_metrics?.listed_count;
        const tweet_count = author?.public_metrics?.tweet_count;

        chain = chain.HSET(`user:${author_id}`, new Map([
            ['username', username || 'unknown'],
            ['followers', (followers_count || 0).toString()],
            ['listed', (listed_count || 0).toString()],
            ['tweets', (tweet_count || 0).toString()],
        ]));
    }

    tags.forEach((tag) => chain = chain.ZADD(`${event}:tags`, { score: 1, value: tag || 'unknown' }, { INCR: true }));
    mentions.forEach((username) => chain = chain.ZADD(`${event}:mentions`, { score: 1, value: username || 'unknown' }, { INCR: true }));
    urls.forEach((url) => chain = chain.ZADD(`${event}:urls`, { score: 1, value: url || 'unknown' }, { INCR: true }));

    // store all the counts by reference
    if (reference !== null) {
        chain = chain.ZADD(`${event}:refs`, { score: 1, value: reference || 'unknown' }, { INCR: true });
    }

    await chain.exec();
}

function getAuthor(id, users: ExpandedUser[] = []) {
    return users.reduce((prev: ExpandedUser | null, curr) => {
        if (prev === null && curr.id === id) {
            return curr;
        }
        return prev;
    }, null);
}

function parseEntities({ hashtags = [], mentions = [], urls = [] }: TweetEntitities) {
    // set up friendly strings for event sorting
    return {
        tags: hashtags.map(({ tag }) => tag.toLowerCase()),
        mentions: mentions.map(({ username }) => username),
        urls: urls.map(({ unwound_url }) => unwound_url),
    }
}
