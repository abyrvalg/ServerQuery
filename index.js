const HB = require('handlebars');
var globalConfig = {},
	allResources = {};
	
function executeCall(query){
	var obj = {};
	for(let i = 0; i < query.length; i++) {
		if(typeof query[i] == 'string') {
			console.log(query[i]);
			obj[query[i]] = allResources[query[i]]();
			continue;
		}
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
				obj[key] = allResources[key].apply(allResources[key], params);
			}
			catch(e){
				console.log(e);
			}
		}		
	}
	return obj;
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
				var result = executeCall(JSON.parse(req.query.query));
				resp.json(result);
			}
			catch(e){
				console.log(e);
			}
		});
	},
	call(query, cb, template){
		var result = executeCall(query);
		if(!template) {
			cb(result);
		}
		var fs = require('fs');
		fs.readFile('templates/'+template.replace(/\./g, '')+'.hbs', function(err, data){
			if (!err) {
				var source = data.toString();
				template = hb.compile(source)
				cb(template(result));
			} else {
				console.log(err);
			}
		});
	}
}