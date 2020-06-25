# Robocat

A simple Github repository search replace

- Simple script to search replace in a file and create a new branch on github with the change

```bash
GITHUB_TOKEN= npx robocat -r owner/repo -f .buildkite/pipeline.yml -b master -m 'master - main' -b main -o master main
```