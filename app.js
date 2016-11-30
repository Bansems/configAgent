'use strict';

const HOSTNAME = '192.168.32.6';
const PORT = 3100;

// First make sure we have an error catching mechanism before importing libraries and executing code.
const resultToStdOut = (result) => {
    const msg = JSON.stringify(result);
    process.stdout.write(msg + '\n');
    process.exit(1);
}

process.on('uncaughtException', (err) => {
    const result = {
        error: err.message
    }
    resultToStdOut(result);
});

// Force current working directory to this app directory.
// Invoking from inmation script the working directory is by default C:\windows\system32.
process.chdir(__dirname);

const http = require('http');
const path = require('path');
const modelConfigInformation = require('./nodejs/modelConfig.js')

/* ----------------------------------------------------------------------------
-- Composes the inmation object configuration for a model configuration
-- folder structure.
-- @return JSON document which contains the inmation object configuration items.
---------------------------------------------------------------------------- */
const composeModel = () => {
    const folderPath = path.resolve(__dirname, '../config/model');
    const modelConfigManager = new modelConfigInformation.ModelConfigManager(folderPath);
    const inmObjCfgList = modelConfigManager.inmationConfig();
    const result = {
        data: inmObjCfgList
    };
    return result;
}

/* ----------------------------------------------------------------------------
-- Application start method.
-- @param Config To composes and return the module configuration via standard out
-- @param HTTPClient to retrieve the module configuration via a HTTP request.
-- @param HTTPServer Starts the application as a HTTP service. Another instance of this
-- app can then be used to retrieve the model configuration via a HTTP request.
-- @return JSON document which contains the inmation object configuration items.
---------------------------------------------------------------------------- */
const main = (args) => {
    const arg = args[2] || '';
    const cmd = arg.toLowerCase();
    if (cmd === 'Config'.toLowerCase()) {
        const result = composeModel();
        resultToStdOut(result);
    }
    else if (cmd === 'HTTPClient'.toLowerCase()) {
        const options = {
            protocol: 'http:',
            hostname: HOSTNAME,
            port: PORT,
            path: '/',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            }
        };

        const req = http.request(options, (res) => {
            let resBody = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                resBody += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200 && res.statusCode !== 201) {
                    const result = {
                        error: `Error request via HTTP Server code '${res.statusCode}' with message: ${res.statusMessage}.`
                    }
                    resultToStdOut(result);
                }
                const resData = JSON.parse(resBody);
                resultToStdOut(resData);
            });
        });

        req.on('error', (err) => {
            const result = {
                error: err.message
            }
            resultToStdOut(result);
        });

        req.write('');
        req.end();
    }
    else if (cmd === 'HTTPServer'.toLowerCase()) {
        const handleHTTPRequest = (request, response) => {
            const result = composeModel()
            response.headers = [];
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result));
        }
        const server = http.createServer(handleHTTPRequest);

        server.listen(PORT, () => {
            console.log("HTTP Server listening on: %s", PORT);
        });
    }
}

const args = process.argv;
main(args);