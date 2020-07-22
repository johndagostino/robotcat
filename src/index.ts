import { Octokit } from '@octokit/rest';
import { Command } from 'commander';
import winston from 'winston';
import { commit } from './search';
import { remove } from './remove';
import { pullRequest } from './pull_request';
import { removePackage } from './remove_package';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const client = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const searchCommand = new Command('search');
searchCommand
  .option('-b, --branch <branch>', 'Commit branch')
  .option('-o, --override', 'override existing branch')
  .option(
    '-d, --mode <mode>',
    '100644 | 100755 | 040000 | 160000 | 120000',
    '100644'
  )
  .requiredOption('-r, --repo <repo>', 'Github repository')
  .requiredOption('-m, --message <message>', 'Commit message')
  .requiredOption('-f, --file <file>', 'File to change')
  .requiredOption('-p, --parent <parentBranch>', 'Parent branch')
  .arguments('<search> <replace>')
  .action((term, replacement, options) => {
    commit({
      client,
      logger,
      base: options.parentBranch,
      file: options.file,
      branch: options.branch,
      override: options.override,
      mode: options.mode,
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

const removePackageCommand = new Command('remove-package')
  .arguments('<repo> <packageName>')
  .option('-o, --override', 'override existing branch')
  .option('-p, --parent <base>', 'Parent branch')
  .action((repo, packageName) => {
    return removePackage({ client, logger, packageName, repo });
  });

const program = new Command();
program.version('0.0.1');
program.addCommand(searchCommand);
program.addCommand(removeCommand);
program.addCommand(pullRequestCommand);
program.addCommand(removePackageCommand);
program.parse(process.argv);
