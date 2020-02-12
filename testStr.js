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
		return inst1.call('m1?2+2').then((r)=>{
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
		return inst1.call('m1?"bla";\
					p=m2?$m1')
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
				console.log("delagated called");
				console.log(p);
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

		return inst2.call('a = m2 ? 2;\
				m1 ? $a').then((r)=>{
		   console.log(r);
		   return  r == '{"m1":5,"m2":3}'
		});
	}
]
	for(let i = 3; i < tests.length; i++){
		tests[i]().then((r)=>{
			console.log('test '+i+':'+(r ? 'ok' : 'fail'));
		});
	}
