# Robotcat

A simple Github repository tool

- Search: Search and replace in a file and create a new branch
- Remove: Remove a branch from a repository
- Create PR: Create a PR

```bash
GITHUB_TOKEN= npx robotcat search -r owner/repo -f .buildkite/pipeline.yml -b master -m 'master - main' -b main -o master main

GITHUB_TOKEN= npx robotcat remove owner/repo master
```
```

