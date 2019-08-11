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
	{'>' : (p1,p2)=>p1<p2}
];
const specialCharacters = "^\\!\\*\\/\\%\\+\\-\\<\\>\\=";
function runOperator(operator){	
	var strs = [],
	strCounter = 0;
	
	while(~operator.indexOf("(")) operator = operator.replace('(/\(([^\(])\)/g', (m, k)=>{
		runOperator(key);
	});	
	operator = operator.replace(/'[^']+'/g, (str)=>{
		strs.push(str);
		return '$'+(strCounter++);
	});
	for(let i; i < ops.length; i++){
		for(let key in ops[i]) {
			if(ops[i][key]/length == 1){
				operator.replace(new RegExp('\\'+key+'([^'+specialCharacters+'])'+'+','g'), (match, p)=>{
					ops[key](p.replace(/\$(\d+)/g));
				});
			} 
			else {
				operator.replace(new RegExp('\\'+'([^'+specialCharacters+'])'+key+'([^'+specialCharacters+'])'+'+','g'), (match, p1, p2)=>{
					ops[key](p1, p2);
				});
			}
		}
	}
	return operator;
}

module.exports = {
	getParams(key, obj){
		!(key instanceof Array) && (key = [key]);
		var result = key && JSON.stringify(key).replace(/"?_([\w\.]+)"?/g, function(match, key){
			if(key == 'this') {
				return JSON.stringify(obj);
			}
			val = lookDeep(key, obj) || '__failed__';
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