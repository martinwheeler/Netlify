"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const axios_1 = require("axios");
const date_fns_1 = require("date-fns");
const netlify_build_status_1 = require("./netlify_build_status");
const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100);
const siteId = vscode.workspace.getConfiguration('netlify').get('site_id');
const personalAccessToken = vscode.workspace.getConfiguration('netlify').get('api_token');
const netlifyEvents = netlify_build_status_1.default({
    siteId,
    personalAccessToken,
});
const output = vscode.window.createOutputChannel('Netlify');
exports.activate = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const init = () => __awaiter(void 0, void 0, void 0, function* () {
        output.appendLine(`${siteId}: Fetching deploy status`);
        statusBar.text = '$(repo-sync~spin)  Netlify Build Status: Fetching deploy status...';
        statusBar.color = vscode.ThemeColor;
        statusBar.show();
        try {
            const { data: [buildStatus] } = yield axios_1.default.get(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
                headers: Object.assign({}, personalAccessToken ? { 'Authorization': `Bearer ${personalAccessToken}` } : {})
            });
            updateStatusBar({
                state: buildStatus.state,
                branch: buildStatus.branch,
                context: buildStatus.context,
                publishedAt: buildStatus.published_at,
            });
        }
        catch (e) {
            output.clear();
            output.appendLine(`${siteId}: Project not authorized`);
            statusBar.text = '$(issue-opened)  Netlify Build Status: Cannot fetch build status, project unauthorized';
            statusBar.color = 'orange';
            statusBar.show();
            return true;
        }
    });
    const updateStatusBar = ({ state, branch, context, publishedAt }) => {
        if (state === 'ready') {
            const deployTime = publishedAt ? date_fns_1.differenceInSeconds(new Date(), new Date(publishedAt)) : 100;
            if (deployTime < 20) {
                statusBar.text = `$(check)  Netlify Build Status: Deploy to ${context} was successful!`;
                statusBar.color = '#99ff99';
                statusBar.show();
                return;
            }
            output.appendLine(`${siteId}: Listening for build...`);
            statusBar.text = '$(repo-sync)  Netlify Build Status: Listening for build...';
            statusBar.color = vscode.ThemeColor;
            statusBar.show();
            return;
        }
        if (state === 'building') {
            output.appendLine(`${siteId}: ${branch} is deploying to ${context}`);
            statusBar.text = `$(repo-sync~spin)  Netlify Build Status: ${branch} is deploying to ${context}...`;
            statusBar.color = '#99ff99';
            statusBar.show();
            return;
        }
        if (state === 'enqueued') {
            output.appendLine(`${siteId}: ${branch} is enqueued to deploy to ${context}`);
            statusBar.text = `$(clock)  Netlify Build Status: ${branch} is enqueued to deploy to ${context}...`;
            statusBar.color = ' #99ff99';
            statusBar.show();
            return;
        }
        if (state === 'error') {
            output.appendLine(`${siteId}: Failed to deploy ${branch} to ${context}`);
            statusBar.text = `$(issue-opened)  Netlify Build Status: ${branch} failed to deploy to ${context}!`;
            statusBar.color = 'orange';
            statusBar.show();
            return;
        }
    };
    // const fetchNetlifyBuildStatus = () => {
    //   setInterval(async (): Promise<void> => {
    //     const { data: [buildStatus] } = await axios.get(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    //       headers: {
    //         ...personalAccessToken ? { 'Authorization': `Bearer ${personalAccessToken}` } : {},
    //       }
    //     });
    //     updateStatusBar({
    //       state: buildStatus.state,
    //       branch: buildStatus.branch,
    //       context: buildStatus.context,
    //       publishedAt: buildStatus.published_at,
    //     });
    //   }, 10000);
    // };
    const main = () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield init();
        if (res) {
            return;
        }
        // fetchNetlifyBuildStatus();
    });
    if (!siteId) {
        return;
    }
    // main();
});
function deactivate() { }
exports.deactivate = deactivate;
netlifyEvents.on('ready', (buildStatus) => {
    console.log(buildStatus);
});
//# sourceMappingURL=extension.js.map