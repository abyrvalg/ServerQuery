const builtIn = require('./builtin'),
	tools = require('./tools');

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
const specialCharacters = "^\\!\\*\\/\\%\\+\\-\\<\\>\\=";

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
			
		var resolveParams  = (()=>{
			var callbacks;
				subscribe = (keys, cb)=>{
					callbacks[keys.sort().join('|')];
				}
			Object.observe(buffer, (p)=>{
				for(let key in callbacs){
					let params = key.split('|'),
						resolved = true;					
					for(let k in params && !params[k] instanceof Promise){
						if(!buffer[params[k]]) {resolved = false; break;}
					}
					if(resolved){
						callbacks[key];
					}
				}
			}, ["add", "update"]);
			return (params)=>{
				var params = operator.match(/\$w+/g);
				for(let key in params){
					if(!buffer[params.key])
						return new Promise((resolve)=>{
							subscribe(params, resolve)
						})
				}
				return Promise.resolve();
			}
		})();
		
		function getResourceFunction(queryMethod, params){
			
		}
		//!(query instanceof Array) && (query = [query]);
		function runOperator(operator, buffer){
			function resolveDataType(p){
				if(p[0] == "$") return buffer[p];
				if(~['true', 'false'].indexOf(p)) return p == 'true';
				if((/^\d+$/)) return +p;
				return p.replace(/^['"](\S+)['"]$/, "$1");
			};
			return resolveParams(operator).then(()=>{
				for(let i; i < ops.length; i++){
					for(let key in ops[i]) {
						if(ops[i][key].length == 1){
							operator.replace(new RegExp('\\'+key+'([^'+specialCharacters+'])'+'+','g'), (match, p)=>{								
								bufer.anonymous.push(ops[key](p));
								return '$_anonymous'+buffer.anonymous.lenfth-1;
							});
						} 
						else {
							operator.replace(new RegExp('\\'+'([^'+specialCharacters+'])'+key+'([^'+specialCharacters+'])'+'+','g'), (match, p1, p2)=>{
								bufer.anonymous.push(ops[key](p1, p2));
								return '$_anonymous'+buffer.anonymous.lenfth-1;
							});
						}
					}
				}
				return operator;
			});
			//return operator;
		}
		
		function handleExpression(expr){
			let decompsed = expr.match(/^(\w+\=)?(\w+\?)?([\S\s]+)?$/);
			if(decompsed[3]) {
				decompsed[3].replace(/\w+\?[\S\s]+/g, (m, body)=>{ //handle function calls in params
					bufer.anonymous.push(handleExpression(body));
					return '$_anonymous'+buffer.anonymous.lenfth-1
				});
				var params = JSON.parse("["+decompsed[3].replace(/\$\w+/g, '"$0"')+"]"); //[2,true,"$param"]
				for(let i = 0; j < params.length; i++){
					params[i] = runOperator(params[i]);
				}
			}
			if(decomposed[2]){
				buffer[decomposed[1] || decomposed[2]] = getMethod(decomposed[2]).apply(context, params);
			}
			else {
				throw "syntax error in expression"+expr;
			}
		}
		
		function handleQuery(query) {
				query = replace(/\"([^"]+)\"|\'([^']+)\'/g, (m, str)=>{ //save_strings
					buffer.anonymous.push(str);
					return '$_anonymous'+buffer.lenfth-1
				}).replace(/\s+/g,'');
				
				while(query.indexOf('(')) //execute brackets
					query.replace(/\([^\(\)])\)/g, (m, body)=>{
						buffer.anonymous.push(handleStrQuery(body));
						return '$_anonymous'+buffer.lenfth-1
					});		
				query = query.split(';');
				for(let i = 0; i < query.length; i++){
					handleExpression(query[i])
				}
			}
			return promise;
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