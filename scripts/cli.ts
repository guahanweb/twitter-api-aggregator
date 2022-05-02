import path from 'path';
import { Command } from 'commander';
import glob from 'glob';

export class CLI {
    command: Command;

    constructor(command: Command) {
        this.command = command;
        this.init();
    }

    async init() {
        const cwd = path.dirname(__filename);
        const commands = glob.sync('commands/*/index.ts', {
            cwd,
        });

        for (const commandPath of commands) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const command = require(path.resolve(cwd, commandPath));
            command.init(this.command);
        }
    }

    run() {
        this.command.parse(process.argv);
    }
}