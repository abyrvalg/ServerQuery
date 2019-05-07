module.exports = {
	cache(){
		for(let i in arguments) {
			this.cacheSettings.push({
				key : arguments[i][0],
				timeHours : arguments[i][1],
				isSingleServe : arguments[i][2]			
			});
		}

		let queryJson = JSON.stringify(this.currentQuery);
		for(let i in arguments){
			let key = arguments[i][0],
				cacheVal = this.buffer[key],
				match = queryJson.match(new RegExp('(?:(\\w+)\\>)?('+key+')"(?:\\:([^\\}]+))'));
			match && (key = match[1] || match[2]);
			key += JSON.stringify(this.getParams(JSON.parse(match[3]), this.buffer));
			let exp = new Date();
			exp.setHours(exp.getHours() + arguments[i][1])
			this.cache[key] = this.cache[key] || {
				val : cacheVal,
				expiration : exp,
				isSingleServe : arguments[i][2]
			}
		}				
		return;
	},
	writeToCache(){
		
	},
	sendToClientCache(obj) {
		var cache = {}
		for(let i in obj){
			
		}
		return '<script>$.call([{"@writeToCache" : [obj]}])</script>'
	}
}