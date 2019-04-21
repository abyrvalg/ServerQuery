# webQL

WebQL is simple library which allows us to use queries to get things on web.
## How to install
npm install webql --save

##How to use

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

## webQL query syntax
### Overview
WebQL quires are always arrays. Each element of this array represents a resource. If we don't want to pass any parameters to the resource handler we define it as a string.

    webql.call(["resourceName"]);
When we want to pass some parameters to resource handlers, we define an object with one property where the key is the resource name and value is an array of parameters.

    webql.call([{"resourceName": ["paramter1", "parameter2"]}]);
Parameters that we pass to a resource handler do not have to be strings or even primitives.

    webql.call([{"resourceName" : ["string", 1, true, {"key":value},["a", "r", "r", "a", "y"]]}]);
### Using results of previous resource handlers as parameters for futher once
If we want a resource handler to use the result of other one we can do that using "\_" at the beginning of parameter key.
Assume we defined to resource handlers:

    webql.addResources({
        first(){
            return {"key" : "val"}
        },
        second(param){
            var obj = {"val" : "value"}
            return obj[param]
        }
    });
 Now we can call:
 
    webql.call(["first", {"second" : ["\_first.key"]}]).then((result)=>{
        console.log(result); //{first : {key : "val"}, second : "value"}
    }); 
 ### Dominant and buffer modificators
 
 If we want to call a resource only to pass it as a parameter to another resource we can use '?' modificator at the beginning of the resource name.
 
    webql.call(["?first", {"second" : ["\_first.key"]}]).then((result)=>{
        console.log(result); //{second : "value"}
    });
 If we are interested only in one resource we don't need to get it's key so we can use "!" modificator to get rid of it and have only the resource handler result being returned
 
     webql.call(["?first", {"!second" : ["\_first.key"]}]).then((result)=>{
        console.log(result); //"value"
    });
    
 ### Changing resource name
 If we want the result of a resource handler is assign to a different key we can do that using "resourceName>newName" syntax
 
    webql.call(["?first>n1", {"second>n2" : ["\n1.key"]}]).then((result)=>{
        console.log(result); //{"n2" : "value"}
    });
