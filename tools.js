module.exports = {
	getParams(key, obj){
		!(key instanceof Array) && (key = [key]);
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
			val = val || '__failed__';
			if(typeof val == 'object') {
				val = JSON.stringify(val);
			}
			else if(typeof val == 'string') {
				val = '"'+val+'"';
			}
			return val;
		}));
	},
	parseKey(key){
		var match = key.match(/^([\?\!\~\@]+)?([\w]+)(?:\>(\w+))?/);
		return {
			getterKey : match[2],
			mode : match[1] && (~match[1].indexOf('?') ? 'buffer' : ~match[1].indexOf('!') ? 'dominant' : '')|| 'standard',
			settterKey : match[3] || match[2],
			delegated : match[1] && ~match[1].indexOf('~'),
			builtIn : match[1] && ~match[1].indexOf('@')
		}
	}
}