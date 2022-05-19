import { logger } from '../logger';

export function redisScores(list: string[]|null, label: string) {
    let item;
    let result: any[] = [];
    if (list === null) return result;

    try {
        list.forEach((v, i) => {
            if (i % 2 === 0) {
                item = v;
            } else {
                let o: any = {};
                o[label] = item;
                o.score = parseInt(v);
                result.push(o);
            }
        });
        return result;
    } catch (err: any) {
        logger.log('warn', 'could not transform redis scores', { message: err.message, data: list });
        return [];
    }
}