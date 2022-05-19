import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { getDailySummary, getMonthlySummary } from '../../handlers/report';
import { logger } from '../../logger';
import * as transformers from '../transformers';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => RequestHandler
type SummaryMode = 'monthly'|'daily'

function getSummary(mode: SummaryMode, prefix: string, date: Date) {
    return mode === 'monthly'
        ? getMonthlySummary(prefix, date)
        : getDailySummary(prefix);
}

function parseParams(mode: SummaryMode, params: { year: string, month: string, day?: string }) {
    const { year, month, day } = params;
    const prefix = mode === 'monthly' ? `${year}${month}` : `${year}${month}${day}`;
    const dt = `${year}-${month}-` + (mode === 'monthly' ? '01' : day);
    const date = new Date(dt);
    return { prefix, date };
}

function summary(mode: SummaryMode): MiddlewareFunction {
    return async function (req, res, next) {
        try {
            const { prefix, date } = parseParams(mode, req.params);
            const { authors, tags } = await getSummary(mode, prefix, date);
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

function report(mode: SummaryMode): MiddlewareFunction {
    return async function (req, res, next) {
        try {
            const { prefix, date } = parseParams(mode, req.params);
            const { authors, tags } = await getSummary(mode, prefix, date);
            const summary = {
                tags: transformers.redisScores(tags, 'tag'),
                authors,
            };

            return res.render('summary', { info: { mode, date, ...summary } });
        } catch (err) {
            return res.render('error', { err });
        }
    }
}

// manage configuration of all supported routes here
export default function initialize(app) {
    app.get('/summary/:year([0-9]{4})/:month([0-9]{2})/:day([0-9]{2})', summary('daily'));
    app.get('/summary/:year([0-9]{4})/:month([0-9]{2})', summary('monthly'));
    app.get('/report/:year([0-9]{4})/:month([0-9]{2})/:day([0-9]{2})', report('daily'));
    app.get('/report/:year([0-9]{4})/:month([0-9]{2})', report('monthly'));
}

