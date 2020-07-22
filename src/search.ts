import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';
import { Client } from './client';
import { getOwnerRepo } from './utils';

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
  const { owner, repo } = getOwnerRepo(options.repo);
  const { logger, client } = options;
  const base = options.base ?? 'develop';
  const message = options.message;
  const branch = options.branch;
  const file = options.file;
  const robotcat = new Client(client, logger);

  logger.info(file);

  const repository = await robotcat.getRepository({ owner, repo });
  if (!repository) {
    return;
  }

  await robotcat.getOrCreateBranch({
    override: options.override,
    owner,
    base,
    repo,
    branch,
  });

  const { sha, ref } = await robotcat.getBranchReference({
    owner,
    repo,
    branch,
  });

  const text = await robotcat.getFileContent({
    owner,
    repo,
    path: file,
    ref,
  });

  const re = new RegExp(options.search, 'g');
  // replaceAll
  const result = text.replace(re, options.replace);
  await robotcat.commit({ owner, repo, branch, sha, message }, [
    { path: file, mode: '100644', type: 'blob', content: result },
  ]);
};
