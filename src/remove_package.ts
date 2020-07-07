import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';

import { getRepository, createBranch, getFileContent } from './utils';

const getBranchFromPackage = (packageName: string) => {
  return packageName;
};

export const removePackage = async (options: {
  repo?: string;
  packageName: string;
  branch?: string;
  base?: string;
  message?: string;
  override?: boolean;
  logger: Logger;
  client: Octokit;
}) => {
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) throw Error('Invalid Repository');

  const {
    message,
    branch: branchName,
    packageName,
    client,
    logger,
  } = options;
  const base = options.base ?? 'develop';
  const branch = branchName ? branchName : getBranchFromPackage(packageName);

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

  const ref = reference?.data?.ref;
  const packageContent = await getFileContent(client, {
    owner,
    path: 'package.json',
    repo,
    ref,
  });
  const yarnContent = await getFileContent(client, {
    owner,
    path: 'yarn.lock',
    repo,
    ref,
  });

  const tree = await client.git.createTree({
    base_tree: sha,
    owner: owner,
    repo: repo,
    tree: [
      {
        path: 'package.json',
        mode: '100644',
        type: 'blob',
        content: packageContent,
      },
      { path: 'yarn.lock', mode: '100644', type: 'blob', content: yarnContent },
    ],
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
