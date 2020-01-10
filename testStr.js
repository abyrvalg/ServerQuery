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
		return inst1.call('m1?"bla"').then((r)=>{
			return r == "bla";
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
		return inst1.call("2+2").then((r)=>{
			console.log(r);
			return r == 4;
		});
	}
]
	for(let i = 0; i < tests.length; i++){
		tests[i]().then((r)=>{
			console.log('test '+i+':'+(r ? 'ok' : 'fail'));
		});
	}
