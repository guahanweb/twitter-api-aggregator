import { zeropad } from "../handlers/utils";

export const formatDate = (date: Date, mode: string) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let output = [year, zeropad(month, 2)];
    if (mode === 'daily') output.push(zeropad(day, 2));
    return output.join('-');
}

export const inc = (i: string) => parseInt(i) + 1;

export const isweekly = (mode: string) => mode.toLowerCase() === 'weekly';

export const ucwords = (str: string) => str.replace(/\w\S*/g, (word: string) => word.charAt(0).toUpperCase() + word.slice(1))
