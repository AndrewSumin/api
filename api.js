(function(name, key){
    
    var host = 'http://api.hh.ru/1/json';
    var counter = 0;
    
    var utils = {
        getCounter: function(){
            return counter++;
        },
        createCallback: function(func){
            var callbackName = name + utils.getCounter();
            window[callbackName] = func;
            return callbackName;
        },
        createScript: function (attributes) {
            var script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('charset', 'utf-8');
            for (var i in attributes) {
                script.setAttribute(i, attributes[i]);
            }
            // InsertBefore for IE.
            // If head is not closed and use appendChild IE crashes.
            var head = document.getElementsByTagName('head').item(0);
            head.insertBefore(script, head.firstChild);
        },
        createSrc: function(path, query, callbackName){
            return host + path + '?' + this.createQuery(query, callbackName);
        },
        createQuery: function(query, callbackName){
            var result = ['callback=' + callbackName];
            for (var i in query){
                result.push(this.createParam(i, query[i]));
            }
            return result.join('&');
        },
        createParam: function(key, value){
            value = (value.constructor == Array) ? value : [value];
            var result = [];
            for (var i = 0; i < value.length; i++){
                result.push(key + '=' + value[i]);
            }
            return result.join('&');
        }
    };
    
    var defer = (
        function (
            a, // placeholder for pending callbacks
            b  // placeholder for fulfilled value
        ) { 
            a = []; // callbacks or 0 if fulfilled
            return {
                resolve: function (c) { // fulfillment value
                    b = c; // store the fulfilled value
                    // send the value to every pre-registered callback
                    while (a.length)
                        a.shift()(b);
                    // switch state to "fulfilled"
                    a=0;
                },
                then: function (c) { // callback
                    a ? // if it's not fulfilled yet
                    a.push(c) : // added the callback to the queue
                    c(b); // otherwise, let it know what the fulfilled value
                          // was immediately
                }
            }
        });
        
    var hh = {};

    hh.vacancies = {};

    hh.vacancies.search = function(query) {
        var dfd = defer();
        var callbackName = utils.createCallback(function(json){
            dfd.resolve(json);
        });
        utils.createScript({src: utils.createSrc('/vacancy/search/', query, callbackName)});
        dfd.found = function(callback){
            this.finish = undefined;
            this.then(function(json){callback(json.found);});
            return this;
        };
        dfd.iterate = function(callback){
            var result = [];
            this.then(function(json){
                for (var i = 0, l = json.vacancies.length; i < l; i++){
                    result.push(callback(json.vacancies[i], i, json.vacancies));
                }
            });
            this.finish = function(callback){
                this.then(function(){callback(result);});
                return this;
            };
            return this;
        };
        dfd.done = function(callback){
            callback(this);
            return this;
        };
        return dfd;
    };

    window[name] = hh;

})('hh');
