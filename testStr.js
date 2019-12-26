const LQ = require('./strQuery'),
	inst1 = new LQ(),
	inst2 = new LQ();

var tests = [
	()=>{
		inst1.addResources({
			m1(p){
				console.log("called"+p);
				return p;
			}
		});
		return inst1.call('m1?"bla"').then((r)=>{
			console.log(r);
			return r == "bla";
		});
	}/*,
	()=>{
		inst1.addResources({ //test 0
			m1(p){
				return p;
			},
			m2(p){
				return Promise.resolve(p);
			}
		});
		return inst1.call('m1?"bla";\
					p=m2?$m1;\
					bul=m1?true\
					num=m1?(2+2)*2;\
				rec=m1?(m2?$num)').then((r)=>{
		return p;
		});
	}*/
]
	for(let i in tests){
		tests[i]().then((r)=>{
			console.log('test '+i+':'+(r ? 'ok' : 'fail'));
		});
	}
