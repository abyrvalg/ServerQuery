# webQL

WebQL is simple libery which allows us to use queries to get things on web.
#How to isntall
npm install webql --save

#How to use

Adding resources:
const webql = require('webql');
webql.addResources({
    test(){
        return "Test resource"
    },
    testWithParam(param){
        return "your param is "+param
    }
});

Getting resource by query (server or client):
const webql = require(webql);

webql.call(["test", {"testWithParam" : ["myParam"]}]).then((result)=>{
    console.log(result); //{test: "Test resource", testWithParam : "your param is myParam"}
});

#webQL query syntax
WebQL quires are always arrays. Each elemet of this array represents a resource. If we don't want to pass any parameters to 
the resource handler we define it as a string as we did in first 
