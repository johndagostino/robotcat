import { Octokit } from '@octokit/rest';
import { Command } from 'commander';
import winston from 'winston';
import { commit } from './search';
import { remove } from './remove';
import { pullRequest } from './pull_request';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const client = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const searchCommand = new Command('search');
searchCommand
  .option('-b, --branch <branch>', 'Commit branch')
  .option('-o, --override', 'override existing branch')
  .requiredOption('-r, --repo <repo>', 'Github repository')
  .requiredOption('-m, --message <message>', 'Commit message')
  .requiredOption('-f, --file <file>', 'File to change')
  .requiredOption('-p, --parent <parent>', 'Parent branch')
  .arguments('<search> <replace>')
  .action((term, replacement, options) => {
    commit({
      client,
      logger,
      base: options.parent,
      file: options.file,
      branch: options.branch,
      override: options.override,
      repo: options.repo,
      message: options.message,
      search: term,
      replace: replacement,
    });
  });

const removeCommand = new Command('remove')
  .arguments('<repo> <branch>')
  .action((repo, branch) => {
    remove({ client, logger, branch, repo });
  });

const pullRequestCommand = new Command('pr')
  .arguments('<repo> <branch>')
  .option('-b, --base <base>', 'Base branch', 'develop')
  .option('-t, --title <title>', 'PR Title', '')
  .action((repo, branch, options) => {
    pullRequest({
      client,
      logger,
      branch,
      repo,
      title: options.title,
      base: options.base,
    });
  });

const program = new Command();
program.version('0.0.1');
program.addCommand(searchCommand);
program.addCommand(removeCommand);
program.addCommand(pullRequestCommand);
program.parse(process.argv);
