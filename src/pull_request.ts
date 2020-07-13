import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';

export const pullRequest = async (options: {
  repo?: string;
  branch?: string;
  base?: string;
  logger: Logger;
  client: Octokit;
}) => {
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) throw Error('Invalid Repository');

  const { branch, base, client, logger } = options;

  try {
    const repository = await client.repos.get({ owner, repo });
    logger.info(`repository loaded: ${repository?.data?.full_name}`);
  } catch (e) {
    logger.error(`failed to load repo ${options.repo}`);
    return;
  }

  await client.repos.getBranch({
    owner,
    repo,
    branch,
  });

  const title = 'Pull Request';

  try {
    await client.pulls.create({ owner, repo, title, base, head: branch });
  } catch (e) {
    logger.debug(e);
  }
};
