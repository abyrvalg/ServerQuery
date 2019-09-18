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
		inst1.call('m1|"bla";\
					p=m2|$m1;\
					bul=m1|true\
					num=m1|(2+2)*2').then((r)=>{
					
		});
	}
]
	for(let i in tests){
		tests[i]().then((r)=>{
			console.log('test '+i+':'+(r ? 'ok' : 'fail'));
		});
	}
