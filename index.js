const HB = require('handlebars');
const PATH = require('path');
var resourceFolder,
	allResources = {};
function getResourceFunction(key){
	return allResources[key] || (()=>{
		var match = key.match(/((?:[^_])+)??(?:\_(\w+))?$/);
		return require(PATH.dirname(require.main.filename) + '/'+resourceFolder+'/'+(match && match[1].replace(/\./g, '/') || '/index'))[match && match[2] || 'index']
	})();
}

function getParams(key, obj){
	return JSON.parse(key && JSON.stringify(key).replace(/"?_([\w\.]+)"?/g, function(match, key){
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
		return val || match;
	}));
}
function executeCall(query){
	var obj = {},
		promise;
	for(let i = 0; i < query.length; i++) {
		let result,currentKey;
		if(typeof query[i] == 'string') {
			currentKey = query[i].split('>');
			result = promise ? promise.then((obj)=>getResourceFunction(currentKey[0])()) : getResourceFunction(currentKey[0])();			;			
		}
		else {
			for(let key in query[i]){
				currentKey = key.split('>');
				try {					
					result = promise ? promise.then((obj)=>{

						return getResourceFunction(currentKey[0]).apply(null, getParams(query[i][key], obj));
					}) : getResourceFunction(currentKey[0]).apply(null, getParams(query[i][key], obj));
				}
				catch(e){
					console.log(e);
				}
			}
		}
		if(result instanceof Promise){
			promise = result.then(function(r){
				obj[currentKey.length > 1 ? currentKey[1] : currentKey[0]] = r; 
				return obj
			});
		}
		else {
			obj[currentKey.length > 1 ? currentKey[1] : currentKey[0]] = result;
		}
	}
	return promise || Promise.resolve(obj);
}
module.exports = {
	addResources(resources){
		Object.assign(allResources, resources);
	},
	setResourceFolder(folder){
		resourceFolder = folder;
	},
	setupRoute(route, app){
		app.all(route, function(req, resp){
			try{
				var promise = executeCall(JSON.parse(req.query.query));
				promise.then((result)=>{
					resp.header("Content-Type", "application/json");
					resp.json(result)
				});
			}
			catch(e){
				console.log(e);
			}
		});
	},
	call(query, template){
		var promise = executeCall(query);
		if(!template) {
			return promise;
		}
		var fs = require('fs');
		return promise.then(function(result){
			return new Promise(function(resolver){
				fs.readFile('templates/'+template.replace(/\./g, '')+'.hbs', function(err, data){
					if (!err) {
						data = data.toString();
						template = HB.compile(data);
						resolver(template(result));
					} else {
						console.log(err);
					}
				});
			});			
		})		
	}
}