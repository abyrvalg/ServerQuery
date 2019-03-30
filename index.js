const HB = require('handlebars');
var globalConfig = {},
	allResources = {};
	
function executeCall(query){
	var obj = {},
		promise;
	for(let i = 0; i < query.length; i++) {
		let result,currentKey;
		if(typeof query[i] == 'string') {
			currentKey = query[i]
			result = allResources[currentKey]();			;			
		}
		else {
			for(let key in query[i]){
				try {
					var params = query[i][key] && query[i][key].join('|').replace(/_([\w\.]+)/g, function(match, key){
							let path = key.split('.'),
								val = obj;
							for(let i = 0; i < path.length; i++){
								if(!val) {
									break;
								}
								val = val[path[i]];
							}
							return val || match;
						}).split('|');
					result = allResources[key].apply(allResources[key], params);
					currentKey = key;
				}
				catch(e){
					console.log(e);
				}
			}
		}
		if(result instanceof Promise){
			promise = result.then(function(r){obj[currentKey] = r; return obj});
		}
		else {
			obj[currentKey] = result;
		}
	}
	return promise || Promise.resolve(obj);
}
module.exports = {
	setConfig(config){
		globalConfig = config;
	},
	addResources(resources){
		Object.assign(allResources, resources);
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
						var source = data.toString();
						template = HB.compile(source)
						resolver(template(result));
					} else {
						console.log(err);
					}
				});
			});			
		})
		
	}
}