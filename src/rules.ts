import needle from 'needle';
import config from './config';
import { logger } from './logger';

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';

export interface TwitterRule {
    value: string;
    tag?: string;
}

if (require.main === module) {
    // when this file is executed directly, we will
    // set up the rules for monitoring

    // first, we remove all the existing rules
    main([
        {
            value: '#opensource',
            tag: 'open source',
        },
    ]);
}

async function main(newRules: TwitterRule[]) {
    const rules = await getAllRules();
    await deleteAllRules(rules);
    logger.info('existing rules deleted', { rules });

    await setRules(newRules);
    logger.info('new rules have been set', { rules: newRules });
}

export async function getAllRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            'authorization': `Bearer ${config.bearerToken}`,
        }
    });

    if (response.statusCode !== 200) {
        logger.error('error retrieving rules', { code: response.statusCode, error: response.statusMessage });
        throw new Error(response.body);
    }

    return response.body;
}

export async function deleteAllRules(rules: any) {
    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map((rule: any) => rule.id);

    const data = {
        "delete": {
            ids,
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${config.bearerToken}`,
        }
    });

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return response.body;
}

export async function setRules(rules: TwitterRule[]) {
    const data = {
        "add": rules
    };

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${config.bearerToken}`,
        }
    });

    if (response.statusCode !== 201) {
        throw new Error(response.body);
    }

    return response.body;
}
