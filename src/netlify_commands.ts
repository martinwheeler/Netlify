import * as vscode from 'vscode';
import * as child from 'child_process';
import { promisify } from 'util';
import { netlifyEvents } from './netlify_eventemitter';

const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100);

let deployUrl: string = '';
let productionSiteUrl: string = '';

// @ts-ignore
const getWorkspaceRootPath = () => vscode.workspace.workspaceFolders[0].uri.fsPath;

const exec = promisify(child.exec);

netlifyEvents.on('*', (ctx) => {
  productionSiteUrl = ctx.url;
});

netlifyEvents.on('all-deploys', async (ctx) => {
  const { stdout: branch } = await exec('git rev-parse --abbrev-ref HEAD', { cwd: getWorkspaceRootPath() });

  const buildStatus = ctx.find((deploy: { branch: string }) => deploy.branch === branch.trim());

  if (!buildStatus) {
    statusBar.text = '$(globe)  No deploy for current branch';
    statusBar.command = undefined;
    statusBar.tooltip = `Please create a PR to view deploy preview`;
    statusBar.show();
    return;
  }

  deployUrl = buildStatus.deploy_ssl_url;

  statusBar.text = '$(globe)  View latest Netlify deploy';
  statusBar.command = 'netlify.viewLatestDeploy';
  statusBar.tooltip = `View the latest deploy for ${branch}`;
  statusBar.show();
});

netlifyEvents.once('*', () => {
  vscode.commands.registerCommand('netlify.viewLatestDeploy', () => {
    vscode.env.openExternal(vscode.Uri.parse(deployUrl));
  });
  
  vscode.commands.registerCommand('netlify.viewProductionSite', () => {
    vscode.env.openExternal(vscode.Uri.parse(productionSiteUrl));
  });
});
