import { Octokit } from '@octokit/rest';
import { Logger } from 'winston';
import { getOwnerRepo } from './utils';
import { Client } from './client';

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
  const { owner, repo } = getOwnerRepo(options.repo);
  const { message, branch: branchName, packageName, client, logger } = options;
  const base = options.base ?? 'develop';
  const branch = branchName ? branchName : getBranchFromPackage(packageName);
  const robotcat = new Client(client, logger);

  const repository = await robotcat.getRepository({ owner, repo });
  if (!repository) {
    return;
  }

  const { reference, sha } = await robotcat.createBranch({
    override: options.override,
    owner,
    repo,
    base,
    branch,
  });

  const ref = reference?.data?.ref;

  const packageContent = await robotcat.getFileContent({
    owner,
    path: 'package.json',
    repo,
    ref,
  });
  const yarnContent = await robotcat.getFileContent({
    owner,
    path: 'yarn.lock',
    repo,
    ref,
  });

  if (!packageContent || !yarnContent) {
    return;
  }

  // yarn rm packagename

  await robotcat.commit(
    {
      owner,
      repo,
      message,
      sha,
      branch,
    },
    [
      {
        content: packageContent,
        path: 'package.json',
      },
      {
        content: yarnContent,
        path: 'yarn.lock',
      },
    ]
  );
};
