const LQ = require('./index'),
	inst1 = new LQ(),
	inst2 = new LQ();

var tests = [
	()=>{
		inst1.addResources({ //test 0
			m1(p){
				return p;
			},
			m2(p){
				return Promise.resolve(p);
			}
		});
		try{
			return inst1.call([{'m2':['asdf']}, {'!m1' : '_m2'}]).then((r)=>{
				return r == 'asdf';
			})
		}
		catch(e){
			return false;
		}
	},
	()=>{ //test 1
		inst2.addResources({
			__delegate__(query){
				return inst1.call(query)
			}
		});
		return inst2.call([{'!m1' : 'aa'}]).then((r)=>{
			return r == 'aa';

		})
	},
	()=>{ //test2
		return inst1.call([{'m1': 'a'}, {'m2' : 'b'}, {'!@aggr' : {'a' : '_m1', 'b' : '_m2'}}]).then((r)=>{
			return JSON.stringify(r) == '{"a":"a","b":"b"}';
		});
	},
	()=>{ //test3
		return inst2.call([{'m1' : 'q'}, {'?@cache':[['m1', 2, false]]}]).then((r)=>{
			if(JSON.stringify(r) !== '{"m1":"q"}'){
				return false;
			} else {
				inst1.addResources({
					m1 : ()=>'a'
				});
				return inst2.call([{'m1' : 'q'}]).then((r)=>{
					return JSON.stringify(r) == '{"m1":"q"}';
				})
			}
		});
	},
	()=>{
		return inst1.call({"@set":["a", "asdfg"]}).then(()=>{
			return inst1.call({"!@get":"a"}).then((r)=>{				
				return r === "asdfg";
			})
		});
	},
	()=>{
		inst2.addResources({ //test 5
			__delegate__(query){
				return inst1.call(query)
			}
		});
		inst1.addResources({
			array(){
				return [{a : 1}, {a : 2}, {a : 3}] 
		}});
			inst1.addResources({
				each(item) {
				item.a ++;
				return item;
			}
		});
		return inst2.call(['array', 
			{'@~map>mapped' : ['_array', 'each']}, 
			{'@!~aggr' : '_mapped'}]).then((r)=>{
			return JSON.stringify(r) == '[{"a":2},{"a":3},{"a":4}]';
		});
	},
	()=>{
		return inst1.call(['array', {'!@sort' : ['_array', 'a', true]}]).then((r)=>{
			return JSON.stringify(r) == '[{"a":3},{"a":2},{"a":1}]';
		});
	},
	()=>{
		return inst1.call(['array', {'!@frame' : ['_array', 1, 1]}]).then((r)=>{
			return JSON.stringify(r) == '[{"a":2}]';
		})
	}
];

	for(let i in tests){
		tests[i]().then((r)=>{
			console.log('test '+i+':'+(r ? 'ok' : 'fail'));
		});
	}
