function lookDeep(key, obj){
	let path = key.split('.'),
		val = obj;
	for(let i = 0; i < path.length; i++){
		if(!val) {
			break;
		}
		val = val[path[i]];
	}
	return val;
}

function resolveParams(operator, buffer){
	var paramNames = operator.match(/\$\w+/g);
	for(let i; i < paramNames.length; i++){
		if(!buffer[paramNames[i]]){
			var notResolved = true;
			break;
		}
	}
	return notResolved ? watchRsolving(buffer,paramNames) : Promise.resolve(buffer);
}



module.exports = {
	getParams(key, obj){
		!(key instanceof Array) && (key = [key]);
		var result = key && JSON.stringify(key).replace(/"?$([\w\.]+)"?/g, function(match, key){
			if(key == 'this') {
				return JSON.stringify(obj);
			}
			val = lookDeep(key, obj);
			if(typeof val == 'object') {
				val = JSON.stringify(val);
			}
			else if(typeof val == 'string') {
				val = '"'+val+'"';
			}
			return val;
		});
		
		return JSON.parse();
	},
	lookDeep : lookDeep,
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