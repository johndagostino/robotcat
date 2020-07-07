import { Octokit } from '@octokit/rest';
import { Command } from 'commander';
import winston from 'winston';
import { commit } from './search';
import { remove } from './remove';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const client = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const searchCommand = new Command('search');
searchCommand
  .requiredOption('-m, --message <message>', 'Commit message')
  .option('-b, --branch <branch>', 'Commit branch')
  .requiredOption('-r, --repo <repo>', 'Github repository')
  .requiredOption('-f, --file <file>', 'File to change')
  .requiredOption('-o, --override', 'override existing branch')
  .requiredOption('-p, --parent <base>', 'Parent branch')
  .arguments('<search> <replace>')
  .action((term, replacement) => {
    return commit({
      client,
      logger,
      base: searchCommand.parent,
      file: searchCommand.file,
      branch: searchCommand.branch,
      override: searchCommand.override,
      repo: searchCommand.repo,
      message: searchCommand.message,
      search: term,
      replace: replacement,
    });
  });

const removeCommand = new Command('remove')
  .arguments('<repo> <branch>')
  .action((repo, branch) => {
    return remove({ client, logger, branch, repo });
  });

const program = new Command();
program.version('0.0.1');
program.addCommand(searchCommand);
program.addCommand(removeCommand);
program.parse(process.argv);
