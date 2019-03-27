var globalConfig = {},
	hb = require('handlebars');
module.exports = {
	setConfig(config){
		globalConfig = config;
	},
	setupRoutes(getter){
		return function(req, res, next) {
			var scope = req.query.scope,
				obj = {};
			if(scope) {
				scope = scope.split('|');
				let noKeys = req.query.noKeys && scope.length == 1;
				console.log(scope);
				for(let i = 0; i < scope.length; i++) {
					let keyValue = scope[i].split(':');
					try {
						console.log(params);
						var params = keyValue[1] && keyValue[1].replace(/_([\w\.]+)/g, function(match, key){
								let path = key.split('.'),
									val = obj;
								for(let i = 0; i < path.length; i++){
									if(!val) {
										break;
									}
									val = val[path[i]];
								}
								return val || match;
							});
						if(noKeys) {
							obj = getter[keyValue[0]](params);
						} else {
							console.log(getter);
							obj[keyValue[0]] = getter[keyValue[0]](params);
							console.log(getter);
						}
					}
					catch(e){
						
					}
				}
			}
			res.json(obj);
		}
	}
}