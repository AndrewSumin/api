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
    
    var defer = function(){
        var a=[], b;
        return{
            resolve: function(c){
                b=c;
                while(a.length) a.shift()(b);
                a=0;
            },
            reject: function(){
                this.then = function(){};
                a = [];
            },
            then: function(c){
                a ? a.push(c) : c(b);
            }
        };
    };
        
    var hh = {};
    
    hh._defer = function(obj, promise){
        this._init(obj);
        this.promise(promise, this);
    };
    
    hh._defer.prototype = {
        success: function(callback){
            this._success.then(callback);
        },
        fail: function(callback){
            this._fail.then(callback);
        },
        promise: function(promise, defer){
            if (!promise){
                return;
            }
            promise.then = function(callback){
                defer.success(function(json){
                    callback(json);
                });
                return this;
            };
            promise.fail = function(callback){
                defer.fail(function(error){
                    callback(error);
                });
                return this;
            };
            promise.error = function(callback){
                defer.fail(function(error){
                    if (error.code === 500){
                        callback(error);
                    }
                });
                return this;
            };
            promise.timeout = function(callback){
                defer.fail(function(error){
                    if (error.code === 503){
                        callaback(error);
                    }
                });
                return this;
            };
        },
        _init: function(obj){
            this._obj = obj;
            this._obj.check = this._obj.check || function(json){return json && !json.error;};
            this._obj.prepare = this._obj.prepare || function(json){return json;};
            this._success = defer();
            this._fail = defer();
            this._timeout = window.setTimeout(this._doFail.bind(this, {error:{code:504, message:'Gateway Timeout'}}), 30000);
            utils.createScript({src: utils.createSrc(this._obj.path, this._obj.params, this._callback())});
        },
        _callback: function(){
            return utils.createCallback(function(json){
                this._doSuccess(json);
            }.bind(this));
        },
        _doSuccess: function(json){
            if (this._timeout){
                window.clearTimeout(this._timeout);
            }
            if (!this._obj.check(json)){
                this._doFail({error:{code:500, message:'Internal Server Error'}});
                return;
            }
            this._fail.reject();
            this._success.resolve(this._obj.prepare(json));
        },
        _doFail: function(json){
            this._success.reject();
            this._fail.resolve(json);
        }
    };

    hh.vacancies = {};

    hh.vacancies.search = function(query) {
        var result = {},
            defer = new hh._defer({
                path: '/vacancy/search/',
                params: query,
                check: function(json){
                    return json.vacancies;
                },
                prepare: function(json){
                    json.vacancies = json.vacancies.map(hh._vacancy);
                    return json;
                }
            }, result);
            
        result.found = function(callback){
            defer.success(function(json){callback(json.found);});
            return this;
        };
        result.iterate = function(callback, resultCallback){
            defer.success(function(json){
                var result = [];
                for (var i = 0, l = json.vacancies.length; i < l; i++){
                    result.push(callback(json.vacancies[i], i, json.vacancies));
                }
                if (resultCallback){
                    resultCallback(result);
                }   
            });
            return this;
        };
        result.pages = function(callback){
            defer.success(function(json){
                callback(new hh._pager(json, query));
            });
            return this;
        };
        result.done = function(callback){
            callback(this);
            return this;
        };
        
        return result;
    };

    hh.vacancies.employer = function(id) {
        var result = {},
            defer = new hh._defer({
                path: '/vacancy/employer/' + id + '/',
                prepare: function(vacancies){
                    return vacancies.map(hh._vacancy);
                }
            }, result);
            
        result.found = function(callback){
            defer.success(function(json){callback(json.found);});
            return this;
        };
        result.iterate = function(callback, resultCallback){
            defer.success(function(vacancies){
                var result = [];
                for (var i = 0, l = vacancies.length; i < l; i++){
                    result.push(callback(vacancies[i], i, vacancies));
                }
                if (resultCallback){
                    resultCallback(result);
                }   
            });
            return this;
        };
        result.done = function(callback){
            callback(this);
            return this;
        };
        
        return result;
    };

    hh.employer = function(id) {
        var result = {},
            defer = new hh._defer({
                path: '/employer/' + id + '/',
                prepare: function(employer){
                    return hh._employer(employer);
                }
            }, result);
        return result;
    };

    hh._vacancy = function(vacancy){
        if (!vacancy.description){
            vacancy.load = function(){
                var defer = new hh._defer({
                    path: '/vacancy/' + vacancy.id + '/',
                    prepare: function(json){
                        return hh._vacancy(json);
                    }
                }, this);
                return this;
            };
        }
        
        vacancy.employer = hh._employer(vacancy.employer);
        
        return vacancy;
    };

    hh._employer = function(employer){
        if (!employer.description){
            employer.load = function(){
                var defer = new hh._defer({
                    path: '/employer/' + employer.id + '/',
                    prepare: function(json){
                        return hh._employer(json);
                    }
                }, this);
                return this;
            };
        }
        return employer;
    };


    hh._pager = function(json, query){
        var page = query.page || 0,
            found = json.found,
            pages = Math.ceil(found / (query.items || 20));
        
        this.page = function(callback){
            callback(page);
            return this;
        };
        this.pages = function(callback){
            callback(pages);
            return this;
        };
        this.isNext = function(){
            return (query.page ? query.page : 0) < pages;
        };
        this.isPrevious = function(){
            return query.page && query.page > 0;
        };
        this.next = function(){
            query = utils.clone(query);
            query.page = Math.min(page + 1, pages);
            return hh.vacancies.search(query);
        };
        this.previous = function(){
            query = utils.clone(query);
            query.page = Math.max(0, page - 1);
            return hh.vacancies.search(query);
        };
    };

    window[name] = hh;

})('hh');
