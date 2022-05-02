import { Command } from 'commander';
import { CLI } from './cli';

export const main = async () => {
    const command = new Command();
    const cli = new CLI(command as any);
    cli.run();
};

if (require.main === module) {
    main();
}
