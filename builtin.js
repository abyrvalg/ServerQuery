const tools = require('./tools');
module.exports = {
	cache(){
		var queryJson = JSON.stringify(this.currentQuery),
			cacheKeys = [];		
		for(let i in arguments){
			let key = arguments[i][0],
				cacheVal = this.buffer[key],
				match = queryJson.match(new RegExp('(?:(\\w+)\\>)?('+key+')"(?:\\:([^\\}]+))'));
			if(!cacheVal){
				return '__defer__';
			}
			match && (key = match[1] || match[2]);
			key += JSON.stringify(tools.getParams(JSON.parse(match[3]), this.buffer));
			let exp = new Date();
			exp.setHours(exp.getHours() + arguments[i][1]);		
			if(!this.cache[key]){
				cacheKeys.push(key);
				this.cache[key] = {
					val : cacheVal,
					expiration : exp,
					isSingleServe : arguments[i][2]
				};
			}		
		}		
		return cacheKeys;
	},
	writeToCache(obj){
		Object.assign(this.cache, obj);
	},
	aggr(obj){
		return obj;
	},
	set(key, val){
		this.scope[key] = val;
	},
	get(key) {
		return this.scope[key];
	},
	map(items, methodName, field) {
		var obj = this.obj;
		return new Promise((resolve, reject)=>{			
			for(let key in items){
				this.promise.then((obj)=>{
					method = this.getResourceFunction(tools.parseKey(methodName), [items[key]], [methodName]); //TODO: add key parsing
					return method.apply(this, [items[key]]);				
				}).then((r)=>{
					items[key] = r;
					return r;
				});
			}
			this.promise.then(()=>{
				resolve(items);
			})	
		})		
	},
	sort(items, key, desc){
		items && items.sort && items.sort((a, b)=>{			
			if(key) {
				a = tools.lookDeep(key, a);
				b = tools.lookDeep(key, b);
				if(!a || !b) return;
			}
			return desc ? (a < b ? 1 : -1) : (a > b ? 1 : -1);
		});
		return items;
	},
	frame(items, offset, limit){
		return items.slice(offset, offset+limit)
	}
}