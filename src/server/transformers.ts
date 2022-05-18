export function redisScores(list: string[], label: string) {
    let item;
    let result: any[] = [];
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
}