'use strict';

/**
 * @namespace HashBrown.Server
 */

const HTTP = require('http');
const FileSystem = require('fs');
const Path = require('path');

// Libs
const Express = require('express');
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');
const AppModulePath = require('app-module-path'); 

// Make sure we can require our source files conveniently
AppModulePath.addPath(APP_ROOT);
AppModulePath.addPath(Path.join(APP_ROOT, 'src'));

// Dependencies
require('Common');
require('Server/Service');
require('Server/Entity');
require('Server/Controller');

// Express app
const app = Express();

app.disable('etag');
app.engine('js', HashBrown.Entity.View.ViewBase.engine);
app.set('view engine', 'js');
app.set('views', Path.join(APP_ROOT, 'template', 'page'));

app.use(CookieParser());
app.use(BodyParser.json({limit: '50mb'}));
app.use(Express.static(Path.join(APP_ROOT, 'public')));
app.use(Path.join('storage', 'plugins'), Express.static(Path.join(APP_ROOT, 'storage', 'plugins')));

// Service shortcuts
global.debug = HashBrown.Service.DebugService;

// HTTP error type
global.HttpError = class HttpError extends Error {
    constructor(code, message) {
        super(message);

        this.code = code;
    }
}

async function main() {
    // Check CLI input
    await HashBrown.Service.AppService.processInput();

    // Register system cleanup event
    for(let signal of [ 'SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'exit' ]) {
	process.on(signal, () => { HashBrown.Service.EventService.trigger('stop'); });
    }

    // Init plugins
    await HashBrown.Service.PluginService.init();

    // Start HTTP server
    let port = process.env.NODE_PORT || process.env.PORT || 8080;
    let server = HTTP.createServer(app).listen(port);

    debug.log('HTTP server restarted on port ' + port, 'HashBrown');
    
    // Init controllers
    for(let name in HashBrown.Controller) {
        if(
            name === 'ResourceController' ||
            name === 'ApiController' ||
            name === 'ControllerBase'
        ) { continue; }

        HashBrown.Controller[name].init(app);
    }

    // Start watching for file changes
    if(process.env.WATCH) {
        HashBrown.Service.DebugService.startWatching();
    }
    
    // Start watching schedule
    HashBrown.Service.ScheduleService.startWatching();
    
    // Start watching media cache
    HashBrown.Service.MediaService.startWatchingCache();
}

main();
