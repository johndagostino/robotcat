import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';
import { getRepository } from './utils';

export const remove = async (options: {
  repo?: string;
  branch?: string;
  logger: Logger;
  client: Octokit;
}) => {
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) throw Error('Invalid Repository');

  const { branch, client, logger } = options;

  const repository = await getRepository(client, { logger, owner, repo });
  if (!repository) {
    return;
  }

  try {
    await client.repos.getBranch({
      owner,
      repo,
      branch,
    });

    await client.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
  } catch (e) {
    logger.debug(e);
  }
};
