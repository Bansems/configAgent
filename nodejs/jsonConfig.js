'use strict';
const fs = require('fs');
const path = require('path');

/* ----------------------------------------------------------------------------
-- Contains logic to read a config.json file in a specific folder and creates
-- a local package dictornary for all .lua script files in the folder. A key contains
-- the filename (without .lua) and value contains the content of the lua script file (script body).
---------------------------------------------------------------------------- */
class ConfigManager {

    constructor(folder = '/') {
        const folderPath = path.resolve(folder);
        const fullname = path.resolve(folderPath, 'config.json');
        const stats = fs.statSync(fullname)
        if (stats.isFile()) {
            const contentStr = fs.readFileSync(fullname, 'utf8');
            this.config = JSON.parse(contentStr);
        }

        const filenames = fs.readdirSync(folderPath);
        this.localPackage = {};
        for (const filename of filenames) {
            if (path.extname(filename) === '.lua') {
                // Remove extension
                const scriptname = path.basename(filename, '.lua');
                const fullFilename = path.resolve(folderPath, filename);
                this.localPackage[scriptname] = fs.readFileSync(fullFilename, 'utf8');
            }
        }

    }

/* ----------------------------------------------------------------------------
-- Retrieves the objects array of the config.json file content.
-- @return object array of the config.json. or an empty array
---------------------------------------------------------------------------- */
    objects() {
        if (this.config) {
            return this.config.objects || [];
        }
    }

/* ----------------------------------------------------------------------------
-- Retrieves a script by name from the local packase dictionary.
-- @param scriptname The name of the lua script file to retrieve the lua script body for.
-- @return The lua script body.
---------------------------------------------------------------------------- */
    scriptByName(scriptname) {
        return this.localPackage[scriptname];
    }
}

exports.ConfigManager = ConfigManager;