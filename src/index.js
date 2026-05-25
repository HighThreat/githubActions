export const appName = 'githubActions-secure-deployment-lab';

export function buildMessage(targetEnvironment) {
  return `Deploying ${appName} to ${targetEnvironment}`;
}