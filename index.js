const builtIn = require('./builtin'),
	tools = require('./tools');

var sharedResourceMethods;
class LiteQL{
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
		context.promise = promise;
		context.handleQuery = handleQuery;	
		context.getResourceFunction = getResourceFunction;
		function getResourceFunction(queryMethod, params, subQuery){	
			var key = queryMethod.getterKey,
				cacheEntryPoint = cache[key+JSON.stringify(params)];
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
			if((!method && (~delegatedBuiltin.indexOf(key) || !queryMethod.builtIn)) || queryMethod.delegated) {
				if(params && !~JSON.stringify(params).indexOf('__failed__')) {
					for(let key in subQuery){
						subQuery[key] = params;
					}
				}
				delegated.push(subQuery);
				return ()=>null;
			}

			if(~JSON.stringify(params).indexOf('__failed__')){
				deferred.push(subQuery);
				return ()=>null;
			}			
			if(queryMethod.builtIn) {
				return builtIn[key];
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
					currentKey = tools.parseKey(key);						
					promise = promise.then((obj)=>{
						var params = tools.getParams(query[i][key], buffer);
						context.cacheSettings = [];
						context.buffer = buffer;
						context.cache = cache;
						context.scope = scope;			
						return getResourceFunction(currentKey, params, query[i])
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
			return promise;
		}
		handleQuery(query);
		if(resources.__delegate__){
			promise = promise.then((obj)=>{
				if(delegated.length) {
					delegated = JSON.parse(JSON.stringify(delegated).replace(/~/g, ''));
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
		
		return new Promise((resolve, reject)=>{
			promise.then((obj)=>{
				if(deferred.length) {
					handleQuery(deferred).then(obj=>resolve(obj))				
				}
				else {
					resolve(obj)
				}
			}).catch((e)=>{
				typeof console !== "undefined" 
					&& console 
					&& console.error 
					&& console.error(e);
				reject(e);
			});
		});
	}
	setResourceMethod(method){
		resourceMethod = method;
		return this;
	}
	static setResourceMethod(method){
		sharedResourceMethods = method;
	}
}
module.exports = LiteQL;