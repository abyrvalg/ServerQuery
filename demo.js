var express = require('express'),
	app = express(),
	serverQuery = require('./index');
	
	
app.get('/', serverQuery.setupRoute({
	test : ()=>1
}))

app.listen(3000);
console.log("run!");