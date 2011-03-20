(function(name, key){

    var host = 'http://api.hh.ru/1/json';
    var counter = 0;

    var A = Array.prototype;
    if (!A.indexOf) {
        A.indexOf = function (searchElement, fromIndex) {
            fromIndex = fromIndex || 0;
            for (var length = this.length; fromIndex < length; fromIndex++) {
                if (this[fromIndex] == searchElement) {
                    return fromIndex;
                }
            }
            return -1;
        };
    }
    if (!A.lastIndexOf) {
        A.lastIndexOf = function (searchElement, fromIndex) {
            var length = this.length;
            fromIndex = fromIndex || length - 1;
            if (fromIndex < 0) {
                fromIndex += length;
            }
            for (; fromIndex >= 0; fromIndex--) {
                if (this[fromIndex] == searchElement) {
                    return fromIndex;
                }
            }
            return -1;
        };
    }
    if (!A.every) {
        A.every = function (callback, thisObject) {
            thisObject = thisObject || window;
            var index = 0, length = this.length;
            for (; index < length; index++) {
                if (!callback.apply(thisObject, [this[index], index, this])) {
                    break;
                }
            }
            return (index == length);
        };
    }
    if (!A.filter) {
        A.filter = function (callback, thisObject) {
            thisObject = thisObject || window;
            var length = this.length, count = 0, filtered = [];
            for (var index = 0; index < length; index++) {
                if (callback.apply(thisObject, [this[index], index, this])) {
                    filtered[count++] = this[index];
                }
            }
            filtered.length = count;
            return filtered;
        };
    }
    if (!A.forEach) {
        A.forEach = function (callback, thisObject) {
            thisObject = thisObject || window;
            for (var index = 0, length = this.length; index < length; index++) {
                callback.apply(thisObject, [this[index], index, this]);
            }
        };
    }
    if (!A.map) {
        A.map = function (callback, thisObject) {
            thisObject = thisObject || window;
            var length = this.length, map = [];
            for (var index = 0; index < length; index++) {
                map[index] = callback.apply(thisObject, [this[index], index, this]);
            }
            return map;
        };
    }
    if (!A.some) {
        A.some = function (callback, thisObject) {
            thisObject = thisObject || window;
            var index = 0, length = this.length;
            for (; index < length; index++) {
                if (callback.apply(thisObject, [this[index], index, this])) {
                    break;
                }
            }
            return (index != length);
        };
    }
    if (!A.remove) {
        // Array Remove - By John Resig (MIT Licensed)
        A.remove = function(from, to) {
            var rest = this.slice((to || from) + 1 || this.length);
            this.length = from < 0 ? this.length + from : from;
            return this.push.apply(this, rest);
        };
    }


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
            return host + path + '?' + this.createQuery(query, callbackName)
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

    var helper = {};

    helper.vacancy = function(vacancy){
        var links = {}
        for (var i =0; i < vacancy.link.length; i++){
            links[vacancy.link[i].rel] = vacancy.link[i];
        }
        vacancy.link = links;
        return vacancy;
    };

    helper.search = {
        init: function(json, query){
            this.found = json.found;
            this.query = query;
            this.query.page = query.page || 0;
            this.pager = new helper.pager(this);
        }
    };
    helper.search.vacancy = function(json, query){
        this.vacancies = json.vacancies.map(helper.vacancy);
        this.init(json, query);
    };
    helper.search.vacancy.prototype = helper.search;

    helper.pager = function(vacancySearchResult){
        this.page = vacancySearchResult.query.page;
        this.pages = Math.ceil(vacancySearchResult.found / vacancySearchResult.query.items || 20);
        this.prev = function(callback){
            if (this.page <= 0){
                return null;
            }
            vacancySearchResult.query.page--;
            api.vacancies.search(vacancySearchResult.query, callback);
        };
        this.next = function(callback){
            if (this.page >= this.pages){
                return null;
            }
            vacancySearchResult.query.page++;
            api.vacancies.search(vacancySearchResult.query, callback);
        };
        this.exact = function(page){
            if (page <= 0 || page >= this.pages){
                return null;
            }
            vacancySearchResult.query.page = page;
            api.vacancies.search(vacancySearchResult.query, callback);
        };
    };

    var api = {};

    api.vacancies = {};

    api.vacancies.search = function(query, callback) {
        var callbackName = utils.createCallback(function(json){
            callback(new helper.search.vacancy(json, query));
        });
        utils.createScript({src: utils.createSrc('/vacancy/search/', query, callbackName)});
    };

    api.vacancies.employer = function(id, callback) {
        var callbackName = utils.createCallback(function(json){
            callback(json.map(helper.vacancy));
        });
        utils.createScript({src: utils.createSrc('/vacancy/employer/' + id + '/', {}, callbackName)});
    };

    window[name] = api;
})('hh');
