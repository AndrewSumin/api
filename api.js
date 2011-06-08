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
        },
        clone: function(o) {
            if(!o || 'object' !== typeof o)  {
                return o;
            }
            varc = 'function' === typeof o.pop ? [] : {};
            var p, v, c = {};
            for(p in o) {
                if(o.hasOwnProperty(p)) {
                    v = o[p];
                    if(v && 'object' === typeof v) {
                        c[p] = this.clone(v);
                    } else {
                        c[p] = v;
                    }
                }
            }
            return c;
        }
    };
    
    var defer = function(a,b){a=[];return{resolve:function(c){b=c;while(a.length)a.shift()(b);a=0;},then:function(c){a?a.push(c):c(b);}};};
        
    var hh = {};

    hh.vacancies = {};

    hh.vacancies.search = function(query) {
        var dfd = defer();
        var clear = function(dfd){
            dfd.finish = undefined;
        };
        var callbackName = utils.createCallback(function(json){
            dfd.resolve(json);
        });
        utils.createScript({src: utils.createSrc('/vacancy/search/', query, callbackName)});
        dfd.found = function(callback){
            clear(this);
            this.then(function(json){callback(json.found);});
            return this;
        };
        dfd.iterate = function(callback){
            var result = [];
            clear(this);
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
        dfd.pages = function(callback){
            clear(this);
            this.then(function(json){
                var page = query.page || 0,
                    found = json.found,
                    pages = Math.ceil(found / (query.items || 20));
                
                var dfd = defer();
                dfd.page = function(callback){
                    callback(page);
                    return this;
                };
                dfd.pages = function(callback){
                    callback(pages);
                    return this;
                };
                dfd.next = function(){
                    query = utils.clone(query);
                    query.page = page + 1;
                    return hh.vacancies.search(query);
                };
                dfd.previous = function(){
                    query = utils.clone(query);
                    query.page = page - 1;
                    return hh.vacancies.search(query);
                };
                callback(dfd);
            });
            return this;
        };
        dfd.done = function(callback){
            clear(this);
            callback(this);
            return this;
        };
        return dfd;
    };

    window[name] = hh;

})('hh');
