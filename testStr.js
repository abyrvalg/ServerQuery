const LQ = require('./strQuery'),
	inst1 = new LQ(),
	inst2 = new LQ();

var tests = [
	()=>{
		inst1.addResources({
			m1(p){
				return p;
			}
		});
		return inst1.call('m1 ? 2+2').then((r)=>{
			return r == 4;
		});
	},
	()=>{
		inst1.addResources({ //test 0
			m1(p){
				return p;
			},
			m2(p){
				return p;// Promise.resolve(p);
			}
		});
		return inst1.call('m1 ? "bla";\
					       p = m2 ? $m1')
		.then((r)=>{
			return JSON.stringify(r) == '{"m1":"bla","p":"bla"}';
		});
	},
	()=>{
		return inst1.call("2*2").then((r)=>{
			return r == 4;
		});
	},
	()=>{
		inst1.addResources({ //test 0
			m1(p){
				return p;
			},
			m2(p){
				return p;// Promise.resolve(p);
			}
		});
		inst2.addResources({
			__delegate__(query){
				return inst1.call(query);
			},
			m2(p){
				return p+2;
			}
		});

		return inst2.call('a = m1 ? 2;\
						   m2 ? $a').then((r)=>{
		   return  JSON.stringify(r) == '{"a":2,"m2":4}'
		});
	},
	()=>{
		return inst1.call("(2+2)").then((r)=>{//TODO; solve brackets problem
			console.log(r);
			return r == 6;
		});
	},
	()=>{
		inst1.addResources({
			array  : ()=>[{a : 1}, {a : 2}, {a : 3}]
		});
		inst1.call('array;\
				    array = @each ? array & (item)=>{->item.a+1};');  //TODO: implement loops
	}
]
console.log("running "+tests.length+ " tests");
	for(let i = 0; i < 5; i++){
		tests[i]().then((r)=>{
			console.log('test '+i+':'+(r ? 'ok' : 'fail'));
		}).catch((e)=>{
			console.log(e);
		});
	}
