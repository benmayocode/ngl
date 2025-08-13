const DEFAULT_REMOTE = 'https://ngl-project-2025.nw.r.appspot.com/api';
const DEFAULT_LOCAL  = 'http://localhost:8000/api';

let apiRoot =
  localStorage.getItem('apiRoot') ||
  DEFAULT_REMOTE; // default to remote

export function getApiRoot(): string {
  return apiRoot;
}

export function setApiRoot(root: string) {
  apiRoot = root;
  localStorage.setItem('apiRoot', root);
  console.log("API root set to:", root);
}

export function getDefaults() {
  return { DEFAULT_REMOTE, DEFAULT_LOCAL };
}

export function isRemote(): boolean {
  try { return new URL(apiRoot).hostname !== 'localhost'; } catch { return true; }
}
