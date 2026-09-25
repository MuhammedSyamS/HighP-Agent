export const getDesktopAgentDownloadUrl = (): string => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_DESKTOP_AGENT_URL as string)) || '';
  if (envUrl) return envUrl;
  return 'https://github.com/MuhammedSyamS/HighP-desktop-agent/releases/latest';
};

export const getDesktopAgentRepoUrl = (): string => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_DESKTOP_AGENT_REPO_URL as string)) || '';
  if (envUrl) return envUrl;
  return 'https://github.com/MuhammedSyamS/HighP-desktop-agent';
};
