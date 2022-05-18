import * as path from 'path';
import * as fs from 'fs';
import { getClient } from '../dao';
import { zeropad } from '../handlers/utils';

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function getPrefix(year, month, day) {
    return [
        zeropad(year, 4),
        zeropad(month, 2),
        zeropad(day, 2),
    ].join('');
}

export async function getMonthlySummary(prefix: string, date: Date) {
    const monthlyScript = fs.readFileSync(path.resolve(__dirname, 'scripts/summary.monthly.lua')).toString();
    const client = getClient();

    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);


    // let's be sure all the days have been summarized and cached for the month so far
    const keys: string[] = [];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
        const dailyPrefix = getPrefix(currentYear, currentMonth, i);
        let cache_exists = await client.EXISTS(`${dailyPrefix}:authors`);
        if (!cache_exists) await getDailySummary(dailyPrefix);
        keys.push(dailyPrefix);
    }

    // now, let's aggregate the month
    const result = await client.EVAL(monthlyScript, {
        arguments: [
            prefix,
            JSON.stringify(keys),
        ]
    });

    return JSON.parse(result);
}

export async function getDailySummary(prefix: string) {
    const script = fs.readFileSync(path.resolve(__dirname, 'scripts/summary.lua')).toString();
    const client = getClient();

    const result: any = await client.EVAL(script, {
        arguments: [
            prefix,
            // weights: tweeted, retweeted, quoted, replied
            '10', '1', '3', '4',
        ]
    });
    return JSON.parse(result);
}

export async function getAvailableKeys(prefix: string, filter: string = ':authors') {
    const script = fs.readFileSync(path.resolve(__dirname, 'scripts/keys.lua')).toString();
    const client = getClient();

    const result: any = await client.EVAL(script, {
        arguments: [
            prefix,
            filter,
        ]
    });
    return result;
}

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

    return authors;
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