export const getOwnerRepo = (path: string) => {
  const [owner, repo] = path.split('/');
  if (!owner || !repo) throw Error('Invalid Repository');
  return { owner, repo };
};
