import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { getDailySummary, getMonthlySummary } from '../../handlers/report';
import { logger } from '../../logger';
import * as transformers from '../transformers';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => RequestHandler

function normalizePrefix(date: string, daily = false) {
    const format = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.match(format)) throw new Error('invalid date: must be in yyyy-mm-dd format');
    const [ y, m, d ] = date.split('-');
    return {
        date: new Date(date),
        prefix: daily ? `${y}${m}${d}` : `${y}${m}`
    };
}

function summary(): MiddlewareFunction {
    return async function (req, res, next) {
        try {
            const { mode, date } = req.params;
            const normalized = normalizePrefix(date, mode === 'daily');

            let results;
            if (mode === 'daily') {
                results = await getDailySummary(normalized.prefix);
            } else {
                results = await getMonthlySummary(normalized.prefix, normalized.date);
            }

            const { authors, tags } = results;
            const summary = {
                tags: transformers.redisScores(tags, 'tag'),
                authors,
            };

            return res.send({ summary });
        } catch (err: any) {
            logger.error(err.message, err);
            return res.status(500).send({ err: err.message });
        }
    }
}

// manage configuration of all supported routes here
export default function initialize(app) {
    app.get('/summary/:date/:mode', summary());
}

