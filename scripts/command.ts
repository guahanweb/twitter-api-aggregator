import { Command as CommanderCommand } from 'commander';

export interface Command {
    (program: CommanderCommand): void;
}
