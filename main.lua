-- Preload libraries
package.path = '../library_git/lib/?.lua;' .. package.path
local json = require('json')

local configAgent = require('ConfigAgent')

configAgent()
