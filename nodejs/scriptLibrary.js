'use strict';
const fs = require('fs');
const path = require('path');

/* ----------------------------------------------------------------------------
-- Contains logic to read the root config.json file of a model configuration and
-- creates a global package dictionary which contains all scripts defined by the
-- ScriptLibrary in the root config.json. A key contains the filename (without .lua)
-- and value contains the content of the lua script file (script body).
---------------------------------------------------------------------------- */
class ScriptLibraryManager {

    constructor(cfg) {
        this.globalPackage = {};

        for (const scriptLibrary of cfg.ScriptLibraryList) {
            const ns = scriptLibrary.Namespace;
            const folderPath = path.resolve(scriptLibrary.FolderPath);

            const filenames = fs.readdirSync(folderPath);

            for (const filename of filenames) {
                if (path.extname(filename) === '.lua') {
                    // Remove extension
                    const basename = path.basename(filename, '.lua');
                    const scriptname = `${ns}.${basename}`;
                    const fullFilename = path.resolve(folderPath, filename);
                    this.globalPackage[scriptname] = fs.readFileSync(fullFilename, 'utf8');
                }
            }
        }
    }

/* ----------------------------------------------------------------------------
-- Retrieves a script by name from the global package dictionary.
-- @param scriptname The name of the lua script file to retrieve the lua script body for.
-- @return The lua script body.
---------------------------------------------------------------------------- */
    scriptByName(scriptname) {
        return this.globalPackage[scriptname];
    }
}

exports.ScriptLibraryManager = ScriptLibraryManager;