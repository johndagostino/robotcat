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
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
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

  if (!text) return;

  const re = new RegExp(options.search, 'g');
  // replaceAll
  const result = text.replace(re, options.replace);

  if (result === text) {
    logger.error('File not changed');
    return;
  }

  await robotcat.commit({ owner, repo, branch, sha, message }, [
    {
      path: file,
      type: 'blob',
      mode: options.mode ?? '100644',
      content: result,
    },
  ]);
};
