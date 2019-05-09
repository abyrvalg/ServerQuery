module.exports = {
	cache(){
		var queryJson = JSON.stringify(this.currentQuery),
			cacheKeys = [];		
		for(let i in arguments){
			let key = arguments[i][0],
				cacheVal = this.buffer[key],
				match = queryJson.match(new RegExp('(?:(\\w+)\\>)?('+key+')"(?:\\:([^\\}]+))'));			
			match && (key = match[1] || match[2]);
			key += JSON.stringify(this.getParams(JSON.parse(match[3]), this.buffer));
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
	aggregate(obj){
		return obj;
	}
}