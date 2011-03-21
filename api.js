(function(name, key){

    var host = 'http://api.hh.ru/1/json';
    var counter = 0;

    if (!Array.prototype.every) {
        /**
         * @ignore
         */
        Array.prototype.every = function (callback, thisObject) {
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

    if (!Array.prototype.filter) {
        /**
         * @ignore
         */
        Array.prototype.filter = function (callback, thisObject) {
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

    if (!Array.prototype.forEach) {
        /**
         * @ignore
         */
        Array.prototype.forEach = function (callback, thisObject) {
            thisObject = thisObject || window;
            for (var index = 0, length = this.length; index < length; index++) {
                callback.apply(thisObject, [this[index], index, this]);
            }
        };
    }

    if (!Array.prototype.map) {
        /**
         * @ignore
         */
        Array.prototype.map = function (callback, thisObject) {
            thisObject = thisObject || window;
            var length = this.length, map = [];
            for (var index = 0; index < length; index++) {
                map[index] = callback.apply(thisObject, [this[index], index, this]);
            }
            return map;
        };
    }

    if (!Array.prototype.some) {
        /**
         * @ignore
         */
        Array.prototype.some = function (callback, thisObject) {
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

    /**
     * @name api
     * @namespace Holds functionality.
     */
    var hh = {};

    /**
     * @namespace Full and short vacancy objects.
     */
    hh.vacancy = {};

    /**
     * @constructor
     * @example
     * // JSON example
     * {
     *     "id":"4069864",
     *     "link":[
     *         {
     *             "rel":"self",
     *             "type":"application/json",
     *             "href":"http://api.hh.ru/1/json/vacancy/4069864/"
     *         },{
     *             "rel":"alternate",
     *             "type":"text/html",
     *             "href":"http://hh.ru/vacancy/4069864"
     *         }
     *     ],
     *     "name":"PHP программист",
     *     "employer":{
     *         "id":"1455",
     *         "link":[
     *             {
     *                 "rel":"self",
     *                 "type":"application/json",
     *                 "href":"http://api.hh.ru/1/json/employer/1455/"
     *             },{
     *                 "rel":"alternate",
     *                 "type":"text/html",
     *                 "href":"http://hh.ru/employer/1455"
     *             }
     *         ],
     *         "name":"HeadHunter",
     *         "department":{
     *             "code":"hh-1455-TECH",
     *             "link":[
     *                 {
     *                     "type":"text/html",
     *                     "href":"http://hh.ru/employer/1455?dpt=hh-1455-TECH"
     *                 }
     *             ],
     *             "name":"HeadHunter::Технический департамент"
     *         }
     *     },
     *     "update":{
     *         "timestamp":"1300178027"
     *     },
     *     "salary":{
     *         "from":"80000",
     *         "currency":{
     *             "code":"RUR",
     *             "name":"руб."
     *         }
     *     },
     *     "region":{
     *         "id":"1",
     *         "name":"Москва"
     *     },
     *     "site":"http://hh.ru"
     * }
     */
    hh.vacancy.short = function(vacancy){
        var links = {}
        for (var i =0; i < vacancy.link.length; i++){
            links[vacancy.link[i].rel] = vacancy.link[i];
            if (vacancy.salary && vacancy.salary.currency.__text){
                vacancy.salary.currency.name = vacancy.salary.currency__text;
            }
        }
        vacancy.link = links;
        return vacancy;
    };

    /**
     * @namespace Holds search result object.
     * @ignore
     */
    hh.search = {
        /**
         * @private
         */
        init: function(json, query){
            this.found = json.found;
            this.query = query;
            this.query.page = query.page || 0;
            this.pager = new hh.pager(this);
        }
    };

    /**
     * @constructor
     * @description Search vacancy result object.
     * @property {Array} vacancies List of {@link hh.vacancy}
     * @property {Object} pager Pager, see {@link hh.pager}
     * @property {Number} found number of {@link hh.vacancy}
     * @param json JSON response from api
     * @param query Hash of query params
     */
    hh.search.vacancy = function(json, query){
        this.vacancies = json.vacancies.map(hh.vacancy.short);
        this.init(json, query);
    };
    hh.search.vacancy.prototype = hh.search;

    /**
     * @constructor
     * @param object result of search {@link hh.search.vacancy}
     * @property {Number} pages total number of pages
     */

    hh.pager = function(vacancySearchResult){
        this.page = vacancySearchResult.query.page;
        this.pages = Math.ceil(vacancySearchResult.found / vacancySearchResult.query.items || 20);

        /**
         * @description Get previous page of vacancies
         * @param callback Receives a {@link hh.search.vacancy}
         */
        this.prev = function(callback){
            if (this.page <= 0){
                return null;
            }
            vacancySearchResult.query.page--;
            hh.vacancies.search(vacancySearchResult.query, callback);
        };
        /**
         * @description Get next page of vacancies
         * @param callback Receives a {@link hh.search.vacancy}
         */
        this.next = function(callback){
            if (this.page >= this.pages){
                return null;
            }
            vacancySearchResult.query.page++;
            hh.vacancies.search(vacancySearchResult.query, callback);
        };
        /**
         * @description Get exact page of vacancies
         * @param callback Receives a {@link hh.search.vacancy}
         */
        this.exact = function(page){
            if (page <= 0 || page >= this.pages){
                return null;
            }
            vacancySearchResult.query.page = page;
            hh.vacancies.search(vacancySearchResult.query, callback);
        };
    };

    /**
     * @namespace Holds vacancies functionality.
     */
    hh.vacancies = {};

    /**
     * @description Search vacancies by query, callback receive {@link hh.search.vacancy}.
     * @param query Hash with query params
     * @param callback CallBack function, receive {@link hh.search.vacancy}
     * @example
     * hh.vacancies.employer({text:'javascript', region:[1, 2]},
     *     function(result){
     *         function alertName (vacancy){
     *             alert (vacancy.name)
     *         }
     *         result.vacancies.forEach(alertName)
     *     }
     * )
     */
    hh.vacancies.search = function(query, callback) {
        var callbackName = utils.createCallback(function(json){
            callback(new hh.search.vacancy(json, query));
        });
        utils.createScript({src: utils.createSrc('/vacancy/search/', query, callbackName)});
    };

    /**
     * @description Get employer vacancies, callback receive array of {@link hh.vacancy}.
     * @param id Employer id
     * @param callback CallBack function, receive array of {@link hh.vacancy}
     * @example
     * hh.vacancies.employer(1455,
     *     function(vacancies){
     *         function alertName (vacancy){
     *             alert (vacancy.name)
     *         }
     *         vacancies.forEach(alertName)
     *     }
     * )
     */
    hh.vacancies.employer = function(id, callback) {
        var callbackName = utils.createCallback(function(json){
            callback(json.map(hh.vacancy.short));
        });
        utils.createScript({src: utils.createSrc('/vacancy/employer/' + id + '/', {}, callbackName)});
    };

    window[name] = hh;
})('hh');
