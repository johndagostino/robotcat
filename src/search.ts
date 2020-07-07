import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';

export const commit = async (options: {
  repo?: string;
  client: Octokit;
  logger: Logger;
  file?: string;
  message?: string;
  base?: string;
  override?: boolean;
  branch?: string;
  search?: string;
  replace?: string;
}) => {
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) throw Error('Invalid Repository');

  const { logger, client } = options;
  const base = options.base ?? 'develop';
  const message = options.message;
  const branch = options.branch;
  const file = options.file;

  logger.info(file);

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
      if (options.override) {
        await client.git.deleteRef({ owner, repo, ref: `heads/${branch}` });
      } else {
        logger.info(`branch ${branch} already exists.`);
        return;
      }
    }
  } catch (e) {
    logger.debug(e);
  }

  const reference = await client.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha,
  });

  const content = await client.repos.getContent({
    owner,
    repo,
    path: file,
    ref: reference?.data?.ref,
  });
  const body = content?.data?.content;
  const buff = Buffer.from(body, 'base64');
  const text = buff.toString('utf-8');

  const re = new RegExp(options.search, 'g');
  // replaceAll
  const result = text.replace(re, options.replace);

  const tree = await client.git.createTree({
    base_tree: sha,
    owner: owner,
    repo: repo,
    tree: [{ path: file, mode: '100644', type: 'blob', content: result }],
  });

  const newCommitResult = await client.git.createCommit({
    message: message,
    owner,
    parents: [sha],
    repo: repo,
    tree: tree.data.sha,
  });

  const newCommitSha = newCommitResult?.data?.sha;
  await client.git.updateRef({
    owner,
    ref: `heads/${branch}`,
    repo,
    sha: newCommitSha,
  });
};
