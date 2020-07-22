import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';
import { Client } from './client';
import { getOwnerRepo } from './utils';

export const remove = async (options: {
  repo?: string;
  branch?: string;
  logger: Logger;
  client: Octokit;
}) => {
  const { owner, repo } = getOwnerRepo(options.repo);
  const { branch, client, logger } = options;
  const robotcat = new Client(client, logger);

  const repository = await robotcat.getRepository({ owner, repo });
  if (!repository) {
    return;
  }

  try {
    await robotcat.removeBranch({ owner, repo, branch });
  } catch (e) {
    logger.debug(e);
  }
};
