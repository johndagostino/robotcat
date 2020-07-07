import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';
import { getRepository, createBranch, getFileContent } from './utils';

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

  const repository = await getRepository(client, { logger, owner, repo });
  if (!repository) {
    return;
  }

  const { reference, sha } = await createBranch(client, {
    logger,
    override: options.override,
    owner,
    repo,
    base,
    branch,
  });
  const text = await getFileContent(client, {
    owner,
    repo,
    path: file,
    ref: reference?.data?.ref,
  });

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
