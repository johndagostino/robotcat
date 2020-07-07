import { Octokit } from '@octokit/rest';

export const getFileContent = async (
  client: Octokit,
  { owner, path, repo, ref }
) => {
  const content = await client.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  const body = content?.data?.content;
  const buff = Buffer.from(body, 'base64');
  return buff.toString('utf-8');
};

export const getRepository = async (
  client: Octokit,
  { repo, owner, logger }
) => {
  try {
    const repository = await client.repos.get({ owner, repo });
    logger.info(`repository loaded: ${repository?.data?.full_name}`);
  } catch (e) {
    logger.error(`failed to load repo ${repo}`);
    return null;
  }
};

export const createBranch = async (
  client: Octokit,
  { logger, override, owner, repo, base, branch }
) => {
  const branchResp = await client.repos.getBranch({
    owner,
    repo,
    branch: base,
  });
  const sha = branchResp?.data?.commit?.sha;

  try {
    const ref = await client.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    if (ref) {
      if (override) {
        await client.git.deleteRef({ owner, repo, ref: `heads/${branch}` });
      } else {
        logger.info(`branch ${branch} already exists.`);
        return;
      }
    }
  } catch (e) {
    logger.error(e);
  }

  const reference = await client.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha,
  });

  return { reference, sha };
};
