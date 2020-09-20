const builtIn = require('./builtin');
const DELEGATED = Symbol();

const ops = [
	{'!' : (p)=>!p},
	{'*' : (p1,p2)=>p1*p2},
	{"/" : (p1,p2)=>p1/p2},
	{"%" : (p1,p2)=>p1%p2},
	{'+' : (p1,p2)=>p1+p2},
	{'-' : (p1,p2)=>p1-p2},
	{'<='  : (p1,p2)=>p1<=p2},
	{'>=' : (p1,p2)=>p1<=p2},
	{'!=' : (p1,p2)=>p1!=p2},
	{'=' : (p1,p2)=>p1==p2},
	{'<' : (p1,p2)=>p1<p2},
	{'>' : (p1,p2)=>p1<p2},
	{'||' : (p1,p2)=>p1||p2},
	{'&&' : (p1,p2)=>p1||p2}
];
const specialCharacters = "\\!\\*\\/\\%\\+\\-\\<\\>\\=";

function handleQuery(query, buffer, getResourceFunction, __delegate__, delegated) {
	var response = {},
		promise = Promise.resolve(response),
		extraPromises = [];

	query = query.replace(/\"([^"]+)\"|\'([^']+)\'|(true)|(false)/g, (m, str)=>{ //save strings and Booleans
		buffer.anonymous.push({"true":true, "false":false}[str] || str);
		return '$_'+(buffer.anonymous.length-1);
	}).replace(/\s+/g,'').replace(/[^a-z_](\d+)[^a-z_]/ig, (m, num)=>{
		buffer.anonymous.push(+num);
		return '$_'+(buffer.anonymous.length-1);
	});
	while(~query.indexOf('{'))
		query = query.replace(/\{[^\{\}]\}/g, (func)=>{ //save functions
			buffer.anonymous.puhs({func : func});
			return '$_'+(buffer.anonymous.length-1);
		})
	while(~query.indexOf('(')) //save brackets
		query = query.replace(/\(([^\(\)]+)\)/g, (m, query)=>{
			buffer.anonymous.push({query:query});
			return '$anonymous'+(buffer.anonymous.length-1);
		});
	query = query.split(';');


	for(let i = 0; i < query.length; i++){
		promise = promise.then((resp)=>{
			return handleExpression(query[i], buffer, getResourceFunction, extraPromises).then((exprResult)=>{
				for(let key in exprResult){
					response[key] = exprResult[key];
				}
				return response;
			});
		});
	}
	if(__delegate__){
		promise = promise.then((obj)=>{
			if(delegated.length) {
				return __delegate__(delegated.join(';').replace(/\$([a-zA-Z0-9]+)/, (match, key)=>{
					var val = (/anonymous\d+/).test(key) ? buffer.anonymous[key.match(/\d+/)[0]] :  buffer[key];
					return typeof val == "string" ? '"'+val+'"' : val;
				})).then((resp)=>{
					if(delegated.length == 1){
						let key = delegated[0].match(/^(\w+)[\?\=]/)[1];
						resp = {[key]:resp};
					}
					Object.assign(buffer, resp);
					if(obj) {
						Object.assign(obj, resp);
					} else {
						obj = resp;
					}

					return obj;
				})
			}
			else {return obj}
		})
	}

	promise = promise.then((obj)=>{
		for(var i in extraPromises){
			extraPromises[i] = extraPromises[i].then((r)=>{
				Object.assign(obj, r);
				return obj;
			});
		}
		if(extraPromises.length) {
			paramsMgr.checkParams(buffer);
			return extraPromises[i].then();
		}
		return obj;
	});
	return promise;
}

function handleExpression(expr, buffer, getResourceFunction, extraPromises){
	let decomposed = (""+expr).match(/^(?:(\w+)\=)?(?:(\w+)\?)?([\S\s]+)?$/),
		resolvedParams = [],
		paramsPromise = Promise.resolve(resolvedParams);
	if(decomposed[3]) {
		decomposed[3] = decomposed[3].replace(/(?:^|\&)([a-zA-Z]+(?:\?[\S\s]+)?)/g, (m, body)=>{ //handle function calls in params
			buffer.anonymous.push(handleExpression(body, buffer, getResourceFunction, extraPromises));
			return '$anonymous'+buffer.anonymous.lenfth-1
		});
		var params = decomposed[3].split("&");
		for(let i = 0; i < params.length; i++){
			paramsPromise = paramsPromise.then((resolvedParams)=>{
				let operatorResult = runOperator(params[i], buffer);
				if(operatorResult instanceof Promise){
					extraPromises.push(operatorResult.then((r)=>{
						resolvedParams.push(r);
						return resolvedParams;
					}).then((params)=>{
						if(decomposed[2]){
							var result = getResourceFunction(decomposed[2], params, expr).apply(null, params);
							buffer[decomposed[1] || decomposed[2]] = result;
							return {[decomposed[1] || decomposed[2]] : result};
						}else {
							return operatorResult;
						}
					}));
					return;
				}
				return operatorResult;
			}).then((r)=>{
				r && resolvedParams.push(r);
				return resolvedParams;
			});
		}
	}
	if(decomposed[2]){
		return paramsPromise.then((params)=>{
			var result = getResourceFunction(decomposed[2], params, expr).apply(null, params);
			buffer[decomposed[1] || decomposed[2]] = result;
			return {[decomposed[1] || decomposed[2]] : result};
		});
	}
	else {
		return paramsPromise;
	}
}
function runOperator(operator, buffer){
	function resolveDataType(p){
		if(/^\d+$/.test(p)) return +p;
	};
	function run(){
		for(let i=0; i < ops.length; i++){
			for(let key in ops[i]) {
				if(ops[i][key].length == 1){
					operator = operator.replace(new RegExp(key.replace(/(\S)/g, '\\$1')+'([^'+specialCharacters+']+?)'+'+','g'), (match, p)=>{
						buffer.anonymous.push(ops[key](p));
						return '$anonymous'+(buffer.anonymous.length-1);
					});
				}
				else {
					operator = operator.replace(new RegExp('([^'+specialCharacters+']+?)'+key.replace(/(\S)/g, '\\$1')+'([^'+specialCharacters+'])'+'+','g'), (match, p1, p2)=>{
						buffer.anonymous.push(ops[i][key](+p1, +p2));
						return '$anonymous'+(buffer.anonymous.length-1);
					});
				}
				operator = operator.replace(/\$anonymous(\d+)/, (match, p)=>buffer["anonymous"][p]);
			}
		}
		return operator[0] == "$" ? (/^\$anonymous/.test(operator) ? buffer.anonymous[+operator.substr(10)] : buffer[operator.replace(/^\$/, "")]) : +operator;
	}
	var reslovedParam = paramsMgr.resolveParams(operator, buffer);
	if(reslovedParam === true){
		return run();
	}
	return reslovedParam.then(()=>{
		return run();
	});

}
var paramsMgr  = (()=>{
	var callbacks = {},
		subscribe = (keys, cb)=>{
			callbacks[keys.sort().join('|')] = cb;
		};
	return {
		checkParams(buffer){
			for(let i in callbacks){
				let params = i.split('|'),
					isReady = true;
				for(let j in params){
					let param = params[j].replace(/^\$/, "");
					if(!buffer[param] || buffer[param] == DELEGATED) {
						isReady = false;
						break
					}
				}
				if(isReady){
					callbacks[i](buffer);
					delete callbacks[i];
				}
			}
		},
		resolveParams(operator, buffer){
			var params = (""+operator).match(/\$\w+/g);
			for(let key in params){
				let val;
				if(/^\$anonymous/.test(params[key])) {
					let num = params[key].match(/\d+$/);
					num = num && num[0];
					val = buffer.anonymous[num]
				}
				else {
					val = buffer[params[key].substr(1)];
				}
				if(val instanceof Promise) {
					return val.then((r)=>{return r});
				}
				if(!val || val == DELEGATED)
					return new Promise((resolve)=>{
						subscribe(params, resolve)
					})
			}
			return true;
		}
	}
})();


var sharedResourceMethods;
class LiteQL{
	constructor(options){
		options = options || {};
		this.resources = options.resources || {};
		this.resourceMethod = options.resourceMethod;
		this.cache = {};
		this.delegatedBuiltin = options.delegatedBuiltin || [];
	}
	addResources(resources){
		Object.assign(this.resources, resources);
		return this;
	}
	call(query){
		var obj = {},
			buffer = {
				anonymous : []
			},
			delegated = [],
			resourceMethod = this.resourceMethod,
			resources = this.resources,
			cache = this.cache,
			delegatedBuiltin = this.delegatedBuiltin;
		function getResourceFunction(queryMethod, params, subQuery){
			var key = queryMethod,
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

			if(!method && !~delegatedBuiltin.indexOf(key)) {
				delegated.push(subQuery);
				return ()=>DELEGATED;
			}

			if(~JSON.stringify(params).indexOf('__failed__')){
				return ()=>null;
			}
			if(queryMethod.builtIn) {
				return builtIn[key];
			}
			return method;
		}
		var promise = handleQuery(query, buffer, getResourceFunction, resources.__delegate__, delegated).then((response)=>{
			if(Object.keys(response).length == 1) for(let key in response){
				return response[key];
			}
			return response;
		});
		return promise

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