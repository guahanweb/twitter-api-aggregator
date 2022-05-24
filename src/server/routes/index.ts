import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { getDailySummary, getMonthlySummary, getDailyRangeSummary } from '../../handlers/report';
import { zeropad } from '../../handlers/utils';
import { logger } from '../../logger';
import * as transformers from '../transformers';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => RequestHandler
type SummaryMode = 'monthly'|'daily'

function getSummary(mode: SummaryMode, prefix: string, date: Date) {
    return mode === 'monthly'
        ? getMonthlySummary(prefix, date)
        : getDailySummary(prefix);
}

function normalizeDate(y, m, d, mode) {
    const dt = `${y}-${m}-` + (mode === 'monthly' ? '01' : d);
    return new Date(dt);
}

function parseParams(mode: SummaryMode, params: { year: string, month: string, day?: string, from?: string, to?: string }) {
    const { year, month, day, from, to } = params;
    const prefix = mode === 'monthly' ? `${year}${month}` : `${year}${month}${day}`;
    const date = normalizeDate(year, month, day, mode);
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

function weeklyReport(): MiddlewareFunction {
    return async function (req, res, next) {
        try {
            const { year, month, from, to } = req.params;
            const prefix = `${year}${month}`;
            const start = normalizeDate(year, month, from, 'daily');
            const end = normalizeDate(year, month, to, 'daily');

            const { authors, tags } = await getDailyRangeSummary(prefix, start, end);
            const summary = {
                tags: transformers.redisScores(tags, 'tag'),
                authors,
            };

            return res.render('summary', { info: { mode: 'weekly', start, end, ...summary } });
        } catch (err: any) {
            return res.render('error', { err });
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
    app.get('/report/:year([0-9]{4})/:month([0-9]{2})/:from([0-9]{2})-:to([0-9]{2})', weeklyReport());
    app.get('/report/:year([0-9]{4})/:month([0-9]{2})', report('monthly'));
}

