# ConfigAgent

The configuration agent library makes it possible to create and manage the system:inmation object model configurations on disk and import them into system:inmation. In this way the object model configuration and Lua scripts can be managed by your own version control system. 

This library consists of three main components: 


	1. Configuration folder structure
	2. Node.js application
	3. ConfigAgent lua script


## Configuration folder structure

The configuration folder structure contains the JSON representation of the system:inmation object model configuration. Each folder must contain a 
config.json file. 

 Configuration folder structure example:

```
config
+-- model
    +-- config.json
    +-- 01System
        +-- config.json
        +-- Core
            +-- config.json
            +-- LocalConnector
    +-- 02Enterprise
        +-- config.json
+-- scripts
    +--customScript01.lua
```
Folders in the model configuration are processed alphabetically. By adding a number as prefix the order can be influenced.

_ScriptLibrary configuration_

The config.json in the root of folder 'model' is the ScriptLibrary configuration. This configuration file contains the global script library definitions. Each library must have a namespace and a folder path.

ScriptLibrary configuration example:

```json
{
   "version": "1.0",
   "ScriptLibraryList": [
       {
           "Namespace": "inmation",
           "FolderPath": "../library/inmation"
       },
       {
           "Namespace": "customScripts",
           "FolderPath": "../config/scripts/"
       }
   ]
}
```

In the example above the folder path of the inmation library is a relative path, starting from the execution folder of the Node.js application. The FolderPath can also be a fixed path. The namespace is used in the object model config files to reference a script. For example the path library of inmation can be referenced with 'inmation.path'.

_Object Model configuration_

The config.json files other than the config.json file in the root of the 'model' folder are object model configuration files. These files can contain multiple object configurations.

Object model configuration example with:

```json
{
    "version": "1.0",
    "objects": [
        {
            "Path": "/System",
            "ObjectName": "System",
            "Type": "MODEL_CLASS_SYSTEM",
            "ObjectDescription": "System",
            "ScriptLibrary": {
                "explicit": true,
                "ScriptList": [
                    {
                        "LuaModuleName": "json",
                        "scriptReference": "lib.json",
                        "LuaModuleMandatoryExecution": false
                    },
                    {
                        "LuaModuleName": "inmation.string-extension",
                        "scriptReference": "inmation.string-extension",
                        "LuaModuleMandatoryExecution": false
                    },
                    {
                        "LuaModuleName": "inmation.table-extension",
                        "scriptReference": "inmation.table-extension",
                        "LuaModuleMandatoryExecution": false
                    },
                    {
                        "LuaModuleName": "inmation.tracer",
                        "scriptReference": "inmation.tracer",
                        "LuaModuleMandatoryExecution": false
                    },
                    {
                        "LuaModuleName": "inmation.path",
                        "scriptReference": "inmation.path",
                        "LuaModuleMandatoryExecution": false
                    },
                    {
                        "LuaModuleName": "inmation.object",
                        "scriptReference": "inmation.object",
                        "LuaModuleMandatoryExecution": false
                    },
                    {
                        "LuaModuleName": "inmation.objects",
                        "scriptReference": "inmation.objects",
                        "LuaModuleMandatoryExecution": false
                    }
                ]
            }
        },
        {
            "Path": "/System/Core/LocalConnector/UaDatasource01",
            "Type": "MODEL_CLASS_DATASOURCE",
            "ObjectName": "UaDatasource01",
            "ObjectDescription": "OPC US Datasource 01.",
            "ServerType": "EP_OPC_UA",
            "UaConnection.OpcUaServerUrl": "opc.tcp://192.168.1.11:3461/ua",
            "UaConnection.OpcUaOverwriteEndpointHostName": true,
            "UaConnection.OpcUaCClientOptions.OpcUaSubscriptionOptions.OpcUaMaxItemsPerSubscription": 1000,
            "UaConnection.OpcUaCClientOptions.OpcUaSubscriptionOptions.OpcUaMaxSubscriptionNumber": 250
        },
        {
            "Path": "/System/Core/LocalConnector/UaDatasource01/Shades/Shade/ShadeLogic",
            "Type": "MODEL_CLASS_ACTIONITEM",
            "ObjectName": "ShadeLogic",
            "advancedLuaScriptReference": "shadeLogic",
            "refs": [
                { 
                    "name": "Closed",
                    "path": "/System/Core/LocalConnector/HTC32/Shades/Shade/Closed",
                    "type": "OBJECT_LINK_PASSIVE"
                },
                { 
                    "name": "Opened",
                    "path": "/System/Core/LocalConnector/HTC32/Shades/Shade/Opened",
                    "type": "OBJECT_LINK_PASSIVE"
                },
                { 
                    "name": "Close",
                    "path": "/System/Core/LocalConnector/HTC32/Shades/Shade/Close"
                },
                { 
                    "name": "Open",
                    "path": "/System/Core/LocalConnector/HTC32/Shades/Shade/Open"
                }
            ]
        }

    ]
}
```
The object model configuration file contains an array of object config items. Each item can contain multiple properties. The property key must match the system:inmation property path.
An Action Item has to contain the property 'advancedLuaScriptReference'. This Lua script file can also be located in the object model config folder. In this case the advancedLuaScriptReference does not have a namespace defined.

## Node.js application

The Node.js 'app.js' application is used to compose a JSON document based on the configuration folder structure and return it via process standard output, so it can be used in the ConfigAgent Lua script.

### Prerequisites
Node.js v.6.9.1 LTS must be installed on the machine which executes the node.js application. Node.js can be downloaded from <a href="https://nodejs.org">https://nodejs.org</a>.
During installation the feature Add to PATH must be selected. To make sure Node is available in the PATH environment variable of windows, a reboot of the machine is required.

## ConfigAgent lua script

This script retrieves the object module configuration from the file system and creates / modifies the objects in system:inmation. Current version, does not remove objects.

### Prerequisites

The ConfigAgent Lua script must be manually configured in system:inmation. 
Recommended is to create a folder (on core level) and create an Action Item with as Lua Script Body the content of 'configAgent.lua'.

The Script Library of the System object must contain the JSON script library. This library is stored in the lib folder of the inmation Lua library. The module name must be 'json'.
The object model configuration of System must contain the following ScriptItems in the ScriptLibrary.ScriptList:

- json
- inmation.string-extension
- inmation.table-extension
- inmation.tracer
- inmation.path
- inmation.object
- inmation.objects

In the body of the ConfigAgent script the correct path to the Node.js application must be configured:

For example:

```lua
local nodeAppFilename = [["C:\<PROJECTNAME>\configAgent\app.js"]]
```

_Logging_

During execution the Config Agent writes a log file. Therefore the folder c:\inmation.logs must exist.

### Execution

After the ConfigAgent is created manually, it will create a Data Holder Item with ObjectName 'Trigger'. By writing value '1' to this Trigger the ConfigAgent script will execute.
The first time the ConfigAgent executes it will only process the System object to configure the necessary SriptLibrary Items. Next triggers will trigger the ConfigAgent to process the complete object model configuration.


