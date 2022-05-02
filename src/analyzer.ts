import { handler } from './handlers/stream';

export function analyze(payload: any) {
    handler(payload);
}

export function filterFields() {
    return [
        'created_at',
        'author_id',
        'referenced_tweets',
        'geo',
        'entities',
        'public_metrics',
    ]
}

export function filterUserFields() {
    return [
        'id',
        'username',
        'public_metrics',
    ];
}

export function filterExpansions() {
    return [
        'author_id',
        'entities.mentions.username',
    ];
}
