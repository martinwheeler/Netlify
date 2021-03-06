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
const axios_1 = require("axios");
const EventEmitter = require("events");
const date_fns_1 = require("date-fns");
const netlifyEvents = new EventEmitter();
exports.netlifyEvents = netlifyEvents;
const getNetlifyBuildStatus = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield axios_1.default.get(`https://api.netlify.com/api/v1/sites/${ctx.siteId}/deploys`, {
        headers: ctx.apiToken ? { 'Authorization': `Bearer ${ctx.apiToken}` } : {}
    });
    return data;
});
const start = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    netlifyEvents.emit('startup');
    const [, err] = yield getNetlifyBuildStatus(ctx).then((buildEvents) => {
        const [buildStatus] = buildEvents;
        netlifyEvents.emit('*', buildStatus);
        netlifyEvents.emit('all-deploys', buildEvents);
        netlifyEvents.emit(buildStatus.state, buildStatus);
        return [buildStatus, undefined];
    }).catch(err => {
        return [undefined, err];
    });
    if (err) {
        netlifyEvents.emit('fetching-deploy-error', err);
        return 0;
    }
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const buildEvents = yield getNetlifyBuildStatus(ctx);
        const [buildStatus] = buildEvents;
        netlifyEvents.emit('*', buildStatus);
        netlifyEvents.emit('all-deploys', buildEvents);
        if (buildStatus.state === 'ready') {
            const deployTime = buildStatus.published_at ? date_fns_1.differenceInSeconds(new Date(), new Date(buildStatus.published_at)) : 100;
            if (deployTime < 20) {
                netlifyEvents.emit('deploy-successful', buildStatus);
                return;
            }
            netlifyEvents.emit('ready', buildStatus);
        }
        if (buildStatus.state === 'building') {
            netlifyEvents.emit('building', buildStatus);
        }
        if (buildStatus.state === 'enqueued') {
            netlifyEvents.emit('enqueued', buildStatus);
        }
        if (buildStatus.state === 'error') {
            netlifyEvents.emit('error', buildStatus);
        }
    }), ctx.setInterval);
});
exports.start = start;
//# sourceMappingURL=netlify_eventemitter.js.map