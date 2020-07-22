import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';
import { Client } from './client';
import { getOwnerRepo } from './utils';

export const pullRequest = async (options: {
  repo?: string;
  branch?: string;
  title?: string;
  base?: string;
  logger: Logger;
  client: Octokit;
}) => {
  const { owner, repo } = getOwnerRepo(options.repo);
  const { branch, base, client, logger } = options;
  const robotcat = new Client(client, logger);

  const repository = await robotcat.getRepository({ owner, repo });
  if (!repository) {
    return;
  }

  const title = options.title || `${branch} -> ${base}`;
  logger.info(`Creating PR from ${branch} to ${base} with ${title}`);

  try {
    robotcat.createPullRequest({ owner, repo, base, branch, title });
  } catch (e) {
    logger.error(e);
  }
};
