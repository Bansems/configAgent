'use strict';
const fs = require('fs');
const path = require('path');
const jsonConfigInformation = require('./jsonConfig.js');
const scriptLibraryInformation = require('./scriptlibrary.js');

/* ----------------------------------------------------------------------------
-- Contains the logic to process the model configuration folder structure and
-- configuration files
---------------------------------------------------------------------------- */
class ModelConfigManager {

    constructor(folder, recursive) {
        this.globalConfigManager = new jsonConfigInformation.ConfigManager(folder);
        this.globalScriptLibraryManager = new scriptLibraryInformation.ScriptLibraryManager(this.globalConfigManager.config);

        this.configManagers = [];
        this.scanFolderStructure(folder, recursive);
    }

/* ----------------------------------------------------------------------------
-- Scans a folder structure and creates for each folder and config.json file a
-- (local) ConfigManager.
---------------------------------------------------------------------------- */
    scanFolderStructure(folderPath) {
        const filenames = fs.readdirSync(folderPath)
        for (const filename of filenames) {
            const fullname = path.resolve(folderPath, filename);
            const stats = fs.statSync(fullname)
            if (stats && stats.isDirectory()) {
                const configManager = new jsonConfigInformation.ConfigManager(fullname);
                this.configManagers.push(configManager);
                this.scanFolderStructure(fullname);
            }
        }
    }

/* ----------------------------------------------------------------------------
-- Retrieves a scriptbody by reference name.
-- @param configManager Configuration manager for a specific folder
-- @param scriptReference The name of the script to retrieve
-- @return In case the provided configManager contains the scriptReference, this script
-- is returned, otherwise the script in the globalScriptLibraryManager is returned.
---------------------------------------------------------------------------- */
    retrieveScriptBody(configManager, sriptReference) {
        let advancedLuaScript = configManager.scriptByName(sriptReference);
        if (!advancedLuaScript) {
            advancedLuaScript = this.globalScriptLibraryManager.scriptByName(sriptReference);
        }

        if (!advancedLuaScript) {
            throw new Error(`Script '${sriptReference}' not found.`);
        }
        return advancedLuaScript
    }

/* ----------------------------------------------------------------------------
-- Processes the object items of a config.json file. During this process the lua
-- script references in the config files are mapped to script bodies.
-- @param configManager Configuration manager for a specific folder
-- @param inmObjCfgList Array of object configuration items to process.
-- @return Array of processed object configuration items.
---------------------------------------------------------------------------- */
    process(configManager, inmObjCfgList) {
        const _inmObjCfgList = inmObjCfgList || [];
        for (const objCfg of configManager.objects()) {
            const inmObjCfg = {};
            for (const attribName in objCfg) {
                if (attribName !== 'ScriptLibrary' && attribName !== 'advancedLuaScriptReference') {
                    inmObjCfg[attribName] = objCfg[attribName]
                }
                if (attribName === 'advancedLuaScriptReference') {
                    inmObjCfg.AdvancedLuaScript = this.retrieveScriptBody(configManager, objCfg.advancedLuaScriptReference);
                }
            }

            if (objCfg.ScriptLibrary && objCfg.ScriptLibrary.ScriptList) {
                const scriptList = [];
                inmObjCfg.ScriptLibrary = {
                    ScriptList: scriptList
                }
                if (objCfg.ScriptLibrary.explicit) {
                    inmObjCfg.ScriptLibrary.explicit = objCfg.ScriptLibrary.explicit
                }
                for (const scriptCfg of objCfg.ScriptLibrary.ScriptList) {
                    const advancedLuaScript = this.retrieveScriptBody(configManager, scriptCfg.scriptReference)
                    const script = {
                        LuaModuleName: scriptCfg.LuaModuleName,
                        AdvancedLuaScript: advancedLuaScript,
                        LuaModuleMandatoryExecution: scriptCfg.LuaModuleMandatoryExecution
                    };
                    scriptList.push(script);
                }

            }
            _inmObjCfgList.push(inmObjCfg);
        }
        return _inmObjCfgList;
    }

/* ----------------------------------------------------------------------------
-- Retrieves the inmation object configuration items for the complete folder
-- structure of the model configuration.
-- @return Array of inmation object configuration items (json).
---------------------------------------------------------------------------- */
    inmationConfig() {
        const result = [];
        for (const configManager of this.configManagers) {
            this.process(configManager, result);
        }
        return result;
    }
}

exports.ModelConfigManager = ModelConfigManager;