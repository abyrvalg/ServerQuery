const PATH = require('path');
var resourceFolders = [],
	allResources = {},
	logger,
	async = true;
function getResourceFunction(key){
	return allResources[key] || (()=>{
		var match = key.match(/((?:[^_])+)??(?:\_(\w+))?$/);
		for(let i = 0; i < resourceFolders.length; i++){
			let func;
			try{
				func = require(PATH.dirname(require.main.filename) + '/'+resourceFolders[i]+'/'+(match && match[1].replace(/\./g, '/') || '/index'))[match && match[2] || 'index'];
			}
			catch(e){}
			if(func) {
				return func
			}
		}
		return ()=>{console.log("resource:"+key+" is not found"); return null;}
	})();
}

function getParams(key, obj){
	return JSON.parse(key && JSON.stringify(key).replace(/"?_([\w\.]+)"?/g, function(match, key){
		if(key == 'this') {
			return JSON.stringify(obj);
		}
		let path = key.split('.'),
			val = obj;
		for(let i = 0; i < path.length; i++){
			if(!val) {
				break;
			}
			val = val[path[i]];
		}
		if(typeof val == 'object') {
			val = JSON.stringify(val);
		}
		return val;
	}));
}
function parseKey(key){
	var match = key.match(/^([\?\!]+)?(\w+)(?:\>(\w+))?/);
	return {
		gettterKey : match[2],
		mode : {'?' : 'buffer', '!' : 'dominant'}[match[1]] || 'standard',
		settterKey : match[3] || match[2]
	}
}
function executeCall(query){
	var obj = {},
		buffer = {},
		promise;
	for(let i = 0; i < query.length; i++) {
		let result,currentKey;
		if(typeof query[i] == 'string') {
			currentKey = parseKey(query[i]);
			result = promise ? promise.then((obj)=>getResourceFunction(currentKey.gettterKey)()) : getResourceFunction(currentKey.gettterKey)();			;			
		}
		else {
			for(let key in query[i]){
				currentKey = parseKey(key);
				try {					
					result = promise ? promise.then((obj)=>{

						return getResourceFunction(currentKey.gettterKey).apply(null, getParams(query[i][key], buffer));
					}) : getResourceFunction(currentKey.gettterKey).apply(null, getParams(query[i][key], buffer));
				}
				catch(e){
					logger && logger.error(e);
				}
			}
		}
		if(result instanceof Promise){
			promise = result.then(function(r){
				if(currentKey.mode == "standard") {
					obj[currentKey.settterKey] = r; 
				}
				else if(currentKey.mode == "dominant") {
					obj = r;
				}
				buffer[currentKey.settterKey] = r;

				return obj
			});
		}
		else {
			if(currentKey.mode == "standard") {
				obj[currentKey.settterKey] = result; 
			}
			else if(currentKey.mode == "dominant") {
				obj = result;
			}
			buffer[currentKey.settterKey] = result;
		}
	}
	return async ? (promise || Promise.resolve(obj)) : obj;
}
module.exports = {
	addResources(resources){
		Object.assign(allResources, resources);
		return this;
	},
	addResourceFolder(folder){
		resourceFolders.push(folder);
		return this;
	},
	call(query){
		return executeCall(query);
	},
	setLogger(loggerToset){
		logger = loggerToSet;
		return this;
	},
	setAsync(isAsync){
		asinc = isAsync;
	}
}