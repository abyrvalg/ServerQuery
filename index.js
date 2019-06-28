var sharedResourceMethods,
	builtIn = require('./builtin');

function getParams(key, obj){
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
}
function parseKey(key){
	var match = key.match(/^([\?\!]+)?([\@\w]+)(?:\>(\w+))?/);
	return {
		gettterKey : match[2],
		mode : {'?' : 'buffer', '!' : 'dominant'}[match[1]] || 'standard',
		settterKey : match[3] || match[2]
	}
}

class WebQL{
	constructor(options){
		options = options || {};
		this.resources = options.resources || {};
		this.resourceMethod = options.resourceMethod;
		this.cache = {};
		this.delegatedBuiltin = options.delegatedBuiltin || [];
		this.scope = {};
	}
	addResources(resources){
		Object.assign(this.resources, resources);
		return this;
	}
	call(query){
		var obj = {},
			buffer = {},
			promise = Promise.resolve(obj),
			deferred = [],
			delegated = [],
			resourceMethod = this.resourceMethod,
			resources = this.resources,
			cache = this.cache,
			delegatedBuiltin = this.delegatedBuiltin,
			scope = this.scope,
			context = {};
		context.currentQuery = query;			
			
		function getResourceFunction(key, params, subQuery){
			var cacheEntryPoint = cache[key+JSON.stringify(params)];
			if(cacheEntryPoint) {
				let result;
				if(!cacheEntryPoint.expiration || cacheEntryPoint.expiration > (new Date()).getTime()){
					result = cacheEntryPoint.val;
					cacheEntryPoint.singleServe && (delete cache[key+JSON.stringify(params)])
				}
				else {
					delete cache[key+JSON.stringify(params)];
				}
				if(result) {
					return ()=>result;
				}
			}
						
			var method = resources[key] || (resourceMethod ? resourceMethod(key) : (sharedResourceMethods && sharedResourceMethods(key)));
			if(!method) {
				if(params && !~JSON.stringify(params).indexOf('__failed__')) {
					for(let key in subQuery){
						subQuery[key] = params;
					}
				}
				if(key[0] != '@' || ~delegatedBuiltin.indexOf(key.substr(1))) { 
					delegated.push(subQuery);
					return ()=>null;
				}
			}
			if(~JSON.stringify(params).indexOf('__failed__')){
				deferred.push(subQuery);
				return ()=>null;
			}
			if(key[0] == '@') {
				return builtIn[key.substr(1)];
			}
			return method;
		}
		!(query instanceof Array) && (query = [query]);
		function handleQuery(query) {
			for(let i = 0; i < query.length; i++) {
				let currentKey;		
				if(typeof query[i] == 'string') {
					query[i] = {[query[i]] : null}
				}
				for(let key in query[i]){
					currentKey = parseKey(key);					
					promise = promise.then((obj)=>{
						var params = getParams(query[i][key], buffer);
						context.cacheSettings = [];
						context.buffer = buffer;
						context.cache = cache;
						context.getParams = getParams;
						context.scope = scope;
						return getResourceFunction(currentKey.gettterKey, params, query[i])
							.apply(context, params);

					});
				}
				promise = promise.then(function(result){
					if(result == '__defer__'){
						deferred.push(query[i]);
						return obj;
					}
					if(currentKey.mode == "standard") {
						obj[currentKey.settterKey] = result; 						
					}
					else if(currentKey.mode == "dominant" && result !== null) {
						obj = result;
					}
					buffer[currentKey.settterKey] = result;
					return obj
				});
			}
		}
		handleQuery(query);
		if(resources.__delegate__){
			promise = promise.then((obj)=>{
				if(delegated.length) {
					return resources.__delegate__(delegated).then((resp)=>{
						if(~JSON.stringify(delegated).indexOf('!')){
							obj = resp;
						} else {
							Object.assign(obj, resp)
						}
						Object.assign(buffer, resp);										
						return obj;
					})
				}
				else {return obj}
			})
		}
		promise = promise.then((obj)=>{
			if(deferred.length) {
				handleQuery(deferred);
			}
			return obj;
		});
		promise.catch((e)=>{
			typeof console !== "undefined" 
				&& console 
				&& console.error 
				&& console.error(e);
		})
		return promise;
	}
	setResourceMethod(method){
		resourceMethod = method;
		return this;
	}
	static setResourceMethod(method){
		sharedResourceMethods = method;
	}
}
module.exports = WebQL;