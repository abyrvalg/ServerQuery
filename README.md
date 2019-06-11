# webQL

WebQL is a environment agnostic library which allows to get data from mulitple resources using queries. It also can be used as a server API.

## How to use
### Use case 1. Single environment
Adding resources:
```javascript
    const webql = new (require('webql'))();
    webql.addResources({
        test(){
            return "Test resource"
        },
        testWithParam(param){
            return "your param is "+param
        }
    });
```
Getting resource by query:
```javascript
    webql.call(["test", {"testWithParam" : ["myParam"]}]).then((result)=>{
        console.log(result); //{test: "Test resource", testWithParam : "your param is myParam"}
    });
```
### Use case 2. Get data from server 
Server:
```javascript
    const express = require('express');
    const webql = new (require('webql'))();
    var app = express();    
    webql.addResources({
        test(){
            return "Test resource"
        },
        testWithParam(param){
            return "your param is "+param
        }
    });
    app.all('/data', function(req, resp){
        var query = JSON.parse(req.query.query),
			promise = webql.call(query);
        promise.then((result)=>{
            resp.send(result)
        })
    })
```
Client:
```javascript
    const webql = new (require('webql'))();
    webql.addResources({
        __delegate__(query){
            return new Promise((resolver)=>{
                var xmlHttpRequest = new XMLHttpRequest();
                xmlHttpRequest.addEventListener('load', ()=>{
                    resolver(JSON.parse(xmlHttpRequest.responseText));
                });
                xmlHttpRequest.open('GET', '/data?query='+JSON.stringify(query));
                xmlHttpRequest.send();
            });	
        }
    });
    
    webql.call(["test", {"testWithParam" : ["myParam"]}]).then((result)=>{
        console.log(result); //{test: "Test resource", testWithParam : "your param is myParam"}
    });
```

## webQL query syntax
### Overview
WebQL query can be defined as an array or an object. It is required to define it as an array in case if resources depend on each other and order of resolving them matters, otherwise it ok to use objets. Each element of this array/object represents a resource. If we don't want to pass any parameters to the resource handler we define it as a string.
```javascript
    webql.call(["resourceName"]);
```
When we want to pass any parameters to resource handlers, we define an object with one property where the key is the resource name and value is an array of parameters.
```javascript
    webql.call({"resourceName": ["paramter1", "parameter2"]});
```
Parameters that we pass to a resource handler do not have to be strings or even primitives.
```javascript
    webql.call({"resourceName" : ["string", 1, true, {"key": "value"}, ["a", "r", "r", "a", "y"]]});
```
### Using results of previous resource handlers as parameters for futher ones
If we want a resource handler to use the result of other one, we can do that using "\_" at the beginning of parameter key.
Assume we defined two resource handlers:
```javascript
    webql.addResources({
        first(){
            return {"key" : "val"}
        },
        second(param){
            var obj = {"val" : "value"}
            return obj[param]
        }
    });
```
 Now we can call:
 ```javascript
    webql.call(["first", {"second" : ["_first.key"]}]).then((result)=>{
        console.log(result); //{first : {key : "val"}, second : "value"}
    }); 
```
 ### Dominant and buffer modificators
 
 If we want to call a resource only to pass it as a parameter to another resource we can use '?' modificator at the beginning of the resource name.
 ```javascript
    webql.call(["?first", {"second" : ["_first.key"]}]).then((result)=>{
        console.log(result); //{second : "value"}
    });
```
If we are interested only in one resource, we don't need to get its key. So we can use "!" modificator to get rid of it and have only the resource handler result being returned.
```javascript 
     webql.call(["?first", {"!second" : ["_first.key"]}]).then((result)=>{
        console.log(result); //"value"
    });
```
 ### Changing resource name
 If we want the result of a resource handler to be assign to a different key we can do that using "resourceName>newName" syntax
 ```javascript
    webql.call(["?first>n1", {"second>n2" : ["_n1.key"]}]).then((result)=>{
        console.log(result); //{"n2" : "value"}
    });
```

## Adding resource handlers
There are to ways to add resources in WebQL.
First using addResources() method, and second using "setResourceMethod".
Assume we store our resources in "resources" folder and we want to get them using format ```<fileName>.<methodToCall>``` so we can just write:

 ```javascript
 webql.setResourceMethod((key)=>{
    key = key.split(.);
    return require('./resources/'+key[0])[key[1]];
 });
 ```
## Built-in methods
built-in methods help use with post-processing results of our queries. For now two methots are availble. To call a built-in method we define '@' before its name. '@' should be define after modificator.
### cache(\[\<Resource Name\>, \<Time in hours\>, \<is single served\>], ...) \: Cached keys
Cache method is used when we want to remember the resoult of some resource:
 ```javascript
    webql.call(["first>n1", {"second>n2" : ["_n1.key"]}, 
        {
            "?@cache" : [["n1", 2, false], ["n2", 3, true]]
        }
    ]).then((result)=>{
        console.log(result); //The results of "first" result will be cached for 2 hours. The result of "second" resource will be cached for 3 hours. Also resource "second" will be removed after first time we get it from cahce.
    });
 ```
### aggregate("\<object to return\>") \: Result
Agregate method is used to change the "view" of the result
 ```javascript
 webql.call(["first", {"second" : ["_n1.key"]}, 
    {"!@aggregate" : {
        "obj" : {
            "n1" : "_first",
            "n2" : "_second"
        },
        "arr" : ["_first", "_second"]
    }
}]).then((result)=>{
    console.log(result); //{obj : {n1 : {key : "val"}, n2 : "value"}, arr : [{key : "val"}, "value"]}
});
```
 
