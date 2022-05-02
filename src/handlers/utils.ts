import crypto = require('crypto');
import * as fs from 'fs';

export function getPartitionRoot() {
    const dt = new Date();
    return getPartition(dt, dt.getHours());
}

export function getPartition(dt: Date, hour: number) {
    return [
        dt.getFullYear(),
        zeropad(dt.getMonth()+1),
        zeropad(dt.getDate()),
        '_',
        zeropad(hour),
    ].join('');
}

export function shaScript(location: string) {
    const content = fs.readFileSync(location).toString();
    const hash = crypto
        .createHash('sha1')
        .update(content)
        .digest('hex');
    return hash;
}

export function zeropad(value: number, digits: number = 2) {
    return ('0000' + value).slice(-1 * digits);
}