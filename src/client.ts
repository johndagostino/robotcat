import { Octokit } from '@octokit/rest';
import winston from 'winston';

type Files = {
  path?: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
  type?: 'blob' | 'tree' | 'commit';
  sha?: string | null;
  content?: string;
}[];

export class Client {
  client: Octokit;
  logger: winston.Logger;

  constructor(client: Octokit, logger: winston.Logger) {
    this.client = client;
    this.logger = logger;
  }

  async getFileContent({ owner, path, repo, ref }) {
    const content = await this.client.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    const body = content?.data?.content;
    const buff = Buffer.from(body, 'base64');
    return buff.toString('utf-8');
  }

  async getRepository({ repo, owner }) {
    try {
      const repository = await this.client.repos.get({ owner, repo });
      this.logger.info(`repository loaded: ${repository?.data?.full_name}`);
      return repository;
    } catch (e) {
      this.logger.error(`failed to load repo ${repo}`);
      return null;
    }
  }

  async getOrCreateBranch({ owner, override, repo, base, branch }) {
    if (!override) {
      try {
        const br = await this.client.repos.getBranch({
          owner,
          repo,
          branch,
        });
        return br;
      } catch (e) {
        this.logger.info(`branch ${branch} not found, creating`);
      }
    }

    await this.createBranch({
      owner,
      override,
      repo,
      base,
      branch,
    });

    return this.client.repos.getBranch({ owner, repo, branch });
  }

  async createPullRequest({ owner, repo, base, branch, title }) {
    await this.client.repos.getBranch({
      owner,
      repo,
      branch,
    });

    await this.client.pulls.create({ owner, repo, title, base, head: branch });
  }

  async commit({ owner, repo, sha, message, branch }, files: Files) {
    const tree = await this.client.git.createTree({
      base_tree: sha,
      owner: owner,
      repo: repo,
      tree: files,
    });

    const newCommitResult = await this.client.git.createCommit({
      message: message,
      owner,
      parents: [sha],
      repo: repo,
      tree: tree.data.sha,
    });

    const newCommitSha = newCommitResult?.data?.sha;
    await this.client.git.updateRef({
      owner,
      ref: `heads/${branch}`,
      repo,
      sha: newCommitSha,
    });

    return newCommitSha;
  }

  async removeBranch({ owner, repo, branch }) {
    await this.client.repos.getBranch({
      owner,
      repo,
      branch,
    });

    await this.client.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
  }

  async getBranchReference({ owner, repo, branch }) {
    const reference = await this.client.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const branchResp = await this.client.repos.getBranch({
      owner,
      repo,
      branch,
    });

    const sha = branchResp?.data?.commit?.sha;
    const ref = reference?.data?.ref;
    return { sha, ref };
  }

  async createBranch({
    override,
    owner,
    repo,
    base,
    branch,
  }: {
    owner: string;
    repo: string;
    base: string;
    branch: string;
    override?: boolean;
  }) {
    const branchResp = await this.client.repos.getBranch({
      owner,
      repo,
      branch: base,
    });
    const sha = branchResp?.data?.commit?.sha;

    try {
      const ref = await this.client.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      if (ref) {
        if (override) {
          await this.client.git.deleteRef({
            owner,
            repo,
            ref: `heads/${branch}`,
          });
        } else {
          this.logger.info(`branch ${branch} already exists.`);
          return;
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    const reference = await this.client.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha,
    });

    return { reference, sha };
  }
}
