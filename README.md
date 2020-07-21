<h1 align="center">Welcome to robotcat 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/robotcat" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/robotcat.svg">
  </a>
  <a href="#" target="_blank">
    <img alt="License: Apache--2.0" src="https://img.shields.io/badge/License-Apache--2.0-yellow.svg" />
  </a>
</p>

> A simple Github repository tool

- Search: Search and replace in a file and create a new branch
- Remove: Remove a branch from a repository
- Create PR: Create a PR from a branch

Basically allows you to script common operations across a lot of repositories without having to clone them locally

## Install

```sh
npm i -g robotcat

# or use without installing

npx robotcat
```

## 🚀 **Usage**

You will need a [github personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

```bash
GITHUB_TOKEN=123 npx robotcat search -r owner/repo -f .buildkite/pipeline.yml -b master -m 'master - main' -b main -o master main
GITHUB_TOKEN=123 npx robotcat remove owner/repo master
GITHUB_TOKEN=123 npx robotcat pr owner/repo main -b develop -t 'merge main into develop'
```

## Show your support

Give a ⭐️ if this project helped you!