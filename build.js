#!/usr/local/bin/node

var dot = require('dot');
dot.templateSettings.strip = false;

var fs = require('fs');
require('colors');
var _ = require('underscore');
var Docker = require('dockerode');
var tarCmd = "tar";
var child = require('child_process');
var stream = require('stream');

// Set to true for extra debugging
var DEBUG = false;
var IMAGE_NAME = "jolokia/java-jolokia";

JSON.minify = JSON.minify || require("node-json-minify");

(function() {
    var opts = parseOpts();

    processBuild(opts)
})();

// ===============================================================================

function processBuild(opts) {
    var config = getConfig("config.json");
    createAutomatedBuilds(config,opts);
    // If desired create Docker images
    if (opts.options.build) {
        buildImages(config,opts);
    }
}


function createAutomatedBuilds(config,opts) {
    console.log("Creating Automated Builds\n".cyan);

    execWithTemplates(function (templates) {
        config.versions.forEach(function (version) {
            console.log(version.green);
            ensureDir(__dirname + "/" + version);
            var changed = false;
            templates.forEach(function (template) {
                var file = checkForMapping(config, version, template.file);
                if (!file) {
                    // Skip any file flagged as being mapped but no mapping was found
                    return;
                }
                var templateHasChanged =
                    fillTemplate(version + "/" + file,
                        template.templ,
                        _.extend(
                            {},
                            config,
                            {
                                "version": version,
                                "config":  _.extend({}, config.config['default'], config.config[version])
                            }
                        ));
                changed = changed || templateHasChanged;
            });
            if (!changed) {
                console.log("       UNCHANGED".yellow);
            }
        });
    });
}

function getConfig(path) {
    var config = {};
    if (fs.existsSync(path)) {
        config = JSON.parse(JSON.minify(fs.readFileSync(path, "utf8")));
    }
    return config;
}

function buildImages(config,opts) {
    console.log("\n\nBuilding Images\n".cyan);

    var docker = new Docker(getDockerConnectionsParams(opts));
    doBuildImages(docker,config.versions,opts.options.nocache,config);
}

// ===================================================================================

function checkForMapping(config,version,file) {
    if (/^__.*$/.test(file)) {
        var mappings = config.config[version].mappings;
        if (!mappings) {
            mappings = config.config["default"].mappings;
        }
        if (!mappings) {
            return null;
        }
        return mappings[file];
    } else {
        return file;
    }
}

function execWithTemplates(templFunc) {
    var templates = fs.readdirSync("templates");
    var ret = [];
    templates.forEach(function (template) {
        ret.push({
            "templ" : dot.template(fs.readFileSync("templates/" + template)),
            "file" : template
        });
    });
    templFunc(ret);
}

function fillTemplate(file,template,config) {
    var newContent = template(config).trim() + "\n";
    var label = file.replace(/.*\/([^\/]+)$/,"$1");
    if (!newContent.length) {
        console.log("       " + label + ": " + "SKIPPED".grey);
        return false;
    } else {
        var exists = fs.existsSync(file);
        var oldContent = exists ? fs.readFileSync(file, "utf8") : undefined;
        if (!oldContent || newContent.trim() !== oldContent.trim()) {
            console.log("       " + label + ": " + (exists ? "CHANGED".green : "NEW".yellow));
            fs.writeFileSync(file,newContent,{ "encoding" : "utf8"});
            return true;
        }
    }
    return false;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir,0755);
    }
    var stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        throw new Error(dir + " is not a directory");
    }
}


function doBuildImages(docker,versions,nocache,config) {
    if (versions.length > 0) {
        var version = versions.shift();
        console.log(version.magenta);
        var tar = child.spawn(tarCmd, ['-c', '.'], { cwd: __dirname + "/" + version });
        var name = IMAGE_NAME + ":" + version;
        docker.buildImage(
            tar.stdout, { "t": name, "forcerm": true, "q": true, "nocache": nocache ? "true" : "false" },
            function (error, stream) {
                if (error) {
                    throw error;
                }
                stream.pipe(getResponseStream());
                stream.on('end', function () {
                    var tags = config.config[version].tags || [];
                    tags.forEach(function(tag) {
                        docker.getImage(name).tag({"repo": IMAGE_NAME, "tag": tag, "force": true }, function (error, result) {
                            if (error) {
                                throw error;
                            }
                            console.log(result);
                        });
                    });
                    doBuildImages(docker,versions,nocache,config);
                });
            });
    }
}

function getResponseStream() {
    var buildResponseStream = new stream.Writable();
    buildResponseStream._write = function (chunk, encoding, done) {
        var answer = chunk.toString();
        var resp = JSON.parse(answer);

        debug("|| >>> " + answer);
        if (resp.stream) {
            process.stdout.write(resp.stream);
        }
        if (resp.errorDetail) {
            process.stderr.write("++++++++ ERROR +++++++++++\n");
            process.stderr.write(resp.errorDetail.message);
        }
        done();
    };
    return buildResponseStream;
}

function addSslIfNeeded(param,opts) {
    var port = param.port;
    if (port === "2376") {
        // Its SSL
        var options = opts.options;
        var certPath = options.certPath || process.env.DOCKER_CERT_PATH || process.env.HOME + ".docker";
        return _.extend(param,{
            protocol: "https",
            ca: fs.readFileSync(certPath + '/ca.pem'),
            cert: fs.readFileSync(certPath + '/cert.pem'),
            key: fs.readFileSync(certPath + '/key.pem')
        });
    } else {
        return _.extend(param,{
            protocol: "http"
        });
    }
}

function getDockerConnectionsParams(opts) {
    if (opts.options.host) {
         return addSslIfNeeded({
            "host": opts.options.host,
            "port": opts.options.port || 2375
        },opts);
    } else if (process.env.DOCKER_HOST) {
        var parts = process.env.DOCKER_HOST.match(/^tcp:\/\/(.+?)\:?(\d+)?$/i);
        if (parts !== null) {
            return addSslIfNeeded({
                "host" : parts[1],
                "port" : parts[2] || 2375
            },opts);
        } else {
            return {
                "socketPath" : process.env.DOCKER_HOST
            };
        }
    } else {
        return {
            "host" : "http://localhost",
            "port" : 2375
        };
    }
}

function debug(msg) {
    if (DEBUG) {
        process.stdout.write(msg + "\n");
    }
}


function parseOpts() {
    var Getopt = require('node-getopt');
    var getopt = new Getopt([
        ['b' , 'build', 'Build image(s)'],
        ['d' , 'host', 'Docker hostname (default: localhost)'],
        ['p' , 'port', 'Docker port (default: 2375)'],
        ['n' , 'nocache', 'Dont cache when building images'],
        ['h' , 'help', 'display this help']
    ]);

    var help =
        "Usage: node build.js [OPTION]\n" +
        "Generator for Docker builds.\n" +
        "\n" +
        "[[OPTIONS]]\n" +
        "\n" +
        "This script creates so called 'automated builds' for Java with integrated Jolokia\n" +
        "which can be registered at hub.docker.io\n\n" +
        "It uses templates for covering multiple tags of this image.\n\n" +
        "Supported servers:\n\n";

    return getopt.bindHelp(help).parseSystem();
}


