-- ConfigAgent
-- inmation Lua Script
--
-- (c) 2016 inmation
--
-- Version history:
--
-- 20161111.1   Initial release.
--
local io = require('io')
local has_JSON, json = pcall(require,'json')
assert(has_JSON, 'Library json must be available in e.a. /System')

-- Optional, should be supplied with the config.
local has_pathLib, pathLib = pcall(require,'inmation.path')
local has_inmObjectLib, inmObjectLib = pcall(require,'inmation.object')
local has_inmObjectsLib, inmObjectsLib = pcall(require,'inmation.objects')
local has_inmTracerLib, inmTracerLib = pcall(require,'inmation.tracer')

--local nodeAppFilename = [["C:\Development\JNV\Deployment\DokVast\Darwin-NewLogic8_git\inmationConfig\app.js"]]
local nodeAppFilename = [["C:\Share\Darwin-NewLogic8_git\servers\inmation\inmationConfig\app.js"]]

local executionTimeStamp = nil
local selfObjName = inmation.getself().ObjectName

local fileTracer = {
 	write = function(self, msg)
		local file = io.open('c:\\inmation.logs\\' .. selfObjName .. tostring(executionTimeStamp) .. '.txt','a')
		file:write(msg)
		file:flush()
		io.close(file)
	end,
	
	writeLine = function(self, msg)
		self:write(tostring(msg) .. '\n')
	end,

	trace = function(self, timestamp, severity, msg)
		local time = timestamp or inmation.gettime(inmation.now())
		self:writeLine(tostring(time) .. '\t' .. tostring(severity) .. '\t' .. tostring(msg))
	end,

	traceVerbose = function(self, msg)
		self:trace(nil, 'VERB', msg)
	end,
	 
	writeModifiedScriptItems = function(self, scriptLibraryHelper)
		self:traceVerbose('Script library helper for object: ' .. scriptLibraryHelper.inmObj:path())
		local changedSriptItemList = scriptLibraryHelper:changedSriptItems()
		if #changedSriptItemList > 0 then
			for	i,scriptItem in ipairs(changedSriptItemList) do
				self:traceVerbose('Script: ' .. scriptItem.LuaModuleName)

				if scriptItem.oldAdvancedLuaScript ~= nil then	 
					self:traceVerbose('BEGIN ORIGINAL SCRIPT BODY: ' .. scriptItem.LuaModuleName)
					self:traceVerbose(scriptItem.oldAdvancedLuaScript)
					self:traceVerbose('END ORIGINAL SCRIPT BODY: ' .. scriptItem.LuaModuleName)
				end	

				if scriptItem.oldLuaModuleMandatoryExecution ~= nil then
					self:traceVerbose('ORIGINAL LUAMODULEMANDATORYEXECUTION: ' .. tostring(scriptItem.LuaModuleMandatoryExecution))
				end
			end	
		else
			self:traceVerbose('No scripts changed.')	
		end	
	end
}

pcall(function() 
	traceAgent:addTracer(fileTracer)
end)

-- Trigger
local selfObjItem = inmation.getself()
local selfParentPath = selfObjItem:parent():path()
local triggerPath = selfParentPath .. '/Trigger'
local triggerObj = inmation.getobject(triggerPath)
if nil == triggerObj then 
	triggerObj = inmation.createobject(selfParentPath, 'MODEL_CLASS_HOLDERITEM')
	triggerObj.ObjectName = 'Trigger'
	triggerObj.DecimalPlaces = 0
	triggerObj:commit()
	selfObjItem.refs = {{name='Trigger', path=triggerPath}}
	selfObjItem:commit()
end

local nodeAppCmd = function(args)
	local argsString = ''
	if type(args) == 'table' then
		argsString = table.concat(args, ' ')
	end
	return 'node ' .. nodeAppFilename .. ' ' .. argsString
end

local retrieveConfig = function()
	local cmd = nodeAppCmd({ 'Config' })
	--local cmd = nodeAppCmd({ 'HTTPClient' })

	fileTracer:traceVerbose(string.format("Performing cmd: '%s'", cmd))
	local app = io.popen(cmd)
	local jsonString = ''
	for line in app:lines() do
    	jsonString = jsonString .. line
	end
	app:close()
	--fileTracer:traceVerbose(jsonString)
	fileTracer:traceVerbose(string.format("Closed app"))

	local result = json:decode(jsonString)
	if type(result) ~= 'table' then
		fileTracer:traceVerbose(string.format("ERROR: Decoding JSON, got:"))
		fileTracer:traceVerbose(jsonString)
		error('No JSON received.')
	end

	if result.error then
		fileTracer:traceVerbose(string.format("ERROR: App returned error: '%s'", result.error))
		error(result.error)
	end
			
	if type(result.data) ~= 'table' then
		fileTracer:traceVerbose(string.format("ERROR: Bad configuration received, No 'data' field found in json."))
		error('Bad configuration received.')
	end
	return result.data
end

local nativeAssignScriptLibraries = function(obj, objCfg)
	if objCfg.ScriptLibrary and objCfg.ScriptLibrary.ScriptList then
		if objCfg.ScriptLibrary.explicit == true then
			fileTracer:traceVerbose(string.format("Object config '%s' assigning %d ScriptLibrary scripts.", obj:path(), #objCfg.ScriptLibrary.ScriptList))
			local LuaModuleNameList = {}
			local AdvancedLuaScriptList = {}
			local LuaModuleMandatoryExecutionList = {}
			for i, scriptItem in ipairs(objCfg.ScriptLibrary.ScriptList) do
				table.insert(LuaModuleNameList, scriptItem.LuaModuleName)
				table.insert(AdvancedLuaScriptList, scriptItem.AdvancedLuaScript)
				table.insert(LuaModuleMandatoryExecutionList, scriptItem.LuaModuleMandatoryExecution)
			end
			obj.ScriptLibrary.LuaModuleName = LuaModuleNameList
			obj.ScriptLibrary.AdvancedLuaScript = AdvancedLuaScriptList
			obj.ScriptLibrary.LuaModuleMandatoryExecution = LuaModuleMandatoryExecutionList
			obj:commit()
		else
			fileTracer:traceVerbose(string.format("Object config '%s' unable to store scripts, explicit property contains value false.", obj:path()))
		end
	end
end

local execute = function()
	local now = inmation.currenttime()
	executionTimeStamp = string.format("%04d%02d%02d%02d%02d%02d%03d", inmation.gettimeparts(now))
	fileTracer:traceVerbose(string.format("Executing..."))

	if not has_inmObjectLib then
		fileTracer:traceVerbose('Error loading inmation.object library: ' .. tostring(inmObjectLib))
	end
	if not has_inmObjectsLib then
		fileTracer:traceVerbose('Error loading inmation.objects library: ' .. tostring(inmObjectsLib))
	end	

	local inmCfg = retrieveConfig()
	fileTracer:traceVerbose('Number of objects in config: ' .. #inmCfg)
	for i, objCfg in ipairs(inmCfg) do
		fileTracer:traceVerbose(string.format("Processing object #%d in config; name '%s', path '%s'", i, objCfg.ObjectName, objCfg.Path))

		if(has_inmObjectLib and has_inmObjectsLib) then 
			local parentPath = pathLib.parentPath(objCfg.Path)
			local objNew, err = inmObjectsLib:ensureObject(parentPath, objCfg)	
			if objNew ~= nil then
				fileTracer:traceVerbose(string.format("Object '%s' processed successfully.", objNew:path()))
			else
				error(string.format("Failed to process object '%s'; '%s'", objCfg.Path, err))
			end
		else
			-- Only the Scriptlibrary of System will be processed
			if objCfg.Type == 'MODEL_CLASS_SYSTEM' then
				local obj = inmation.getobject(objCfg.Path)
				assert(obj:type() == objCfg.Type, 'Invalid type for system object ' .. objCfg.Path)
				
			 	nativeAssignScriptLibraries(obj, objCfg)
				 -- Reinitialize self to make use of the new System ScriptLibraries.
				selfObj = inmation.getself()
				selfObj.CustomOptions.CustomString = executionTimeStamp
				selfObj:commit()
			 end
		end
	end
	fileTracer:traceVerbose(string.format("Done Executing"))
end

-- Executed everytime on trigger
return function()
	local trigger = inmation.getvalue('Trigger')
	if trigger == 1 then
		execute()
	end
	inmation.setvalue('Trigger', 0)
end