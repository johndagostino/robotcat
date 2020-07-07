import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';

export const remove = async (options: {
  repo?: string;
  branch?: string;
  logger: Logger;
  client: Octokit;
}) => {
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) throw Error('Invalid Repository');

  const { branch, client, logger } = options;

  try {
    const repository = await client.repos.get({ owner, repo });
    logger.info(`repository loaded: ${repository?.data?.full_name}`);
  } catch (e) {
    logger.error(`failed to load repo ${options.repo}`);
    return;
  }

  const branchResp = await client.repos.getBranch({
    owner,
    repo,
    branch,
  });

  try {
    await client.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
  } catch (e) {
    logger.debug(e);
  }
};
