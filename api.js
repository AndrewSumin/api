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
     * @name hhVacancyShort
     * @constructor
     * @param {Object} JSON Response from JSON API
     * @example
     * // example
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
    var hhVacancyShort = function (vacancy){
        var links = {}
        for (var i =0; i < vacancy.link.length; i++){
            links[vacancy.link[i].rel] = vacancy.link[i];
            if (vacancy.salary && vacancy.salary.currency.__text){
                vacancy.salary.currency.name = vacancy.salary.currency__text;
            }
        }
        vacancy.link = links;
        vacancy.employer.getFullInfo = function(callback){
            hh.employer(vacancy.employer.id, callback)
        };
        vacancy.employer.getVacancies = function(callback){
            hh.vacancies.employer(vacancy.employer.id, callback);
        };
        return vacancy;
    };

    /**
     * @ignore
     */
    var hhSearch = {
        /**
         * @private
         */
        init: function(json, query){
            this.found = json.found;
            this.query = query;
            this.query.page = query.page || 0;
            this.pager = new hhPager(this);
        }
    };

    /**
     * @name hhSearchVacancy
     * @constructor
     * @description Search vacancy result object.
     * @property {Array} vacancies List of {@link hhVacancyShort}
     * @property {Object} pager Pager, see {@link hhPager}
     * @property {Number} found number of {@link hhVacancyShort}
     * @param json JSON response from api
     * @param query Hash of query params
     */
    var hhSearchVacancy = function(json, query){
        this.vacancies = json.vacancies.map(hhVacancyShort);
        this.init(json, query);
    };
    hhSearchVacancy.prototype = hhSearch;

    /**
     * @class
     * @name hhPager
     * @param {Object} object result of search {@link hhSearchVacancy}
     * @property {Number} pages Total number of pages
     */
    var hhPager = function (vacancySearchResult){
        this.page = vacancySearchResult.query.page;
        this.pages = Math.ceil(vacancySearchResult.found / vacancySearchResult.query.items || 20);
        this._vacancySearchResult = vacancySearchResult;
    };
    hhPager.prototype = {
        /**
         * @description Get previous page of vacancies
         * @param {Function} callback Receives a {@link hhSearchVacancy}
         */
        prev: function(callback){
            if (this.page <= 0){
                return null;
            }
            this._vacancySearchResult.query.page--;
            hh.vacancies.search(this._vacancySearchResult.query, callback);
        },
        /**
         * @description Get next page of vacancies
         * @param {Function} callback Receives a {@link hhSearchVacancy}
         */
        next: function(callback){
            if (this.page >= this.pages){
                return null;
            }
            this._vacancySearchResult.query.page++;
            hh.vacancies.search(this._vacancySearchResult.query, callback);
        },
        /**
         * @description Get exact page of vacancies
         * @param {Function} callback Receives a {@link hhSearchVacancy}
         */
        exact: function(page){
            if (page <= 0 || page >= this.pages){
                return null;
            }
            this._vacancySearchResult.query.page = page;
            hh.vacancies.search(this._vacancySearchResult.query, callback);
        }
    };

    /**
     * @name hh
     * @namespace Holds functionality.
     */
    var hh = {};

    /**
     * @description Get Employer info
     * @param {Number} id Employer id
     * @param {Function} callback
     * @example
     * hh.employer(1455,
     *     function(employer){
     *         alert (employer.name)
     *     }
     * )
     */
    hh.employer = function(id, callback){
        var callbackName = utils.createCallback(function(json){
            callback(json);
        });
        utils.createScript({src: utils.createSrc('/employer/' + id + '/', {}, callbackName)});
    };

    /**
     * @namespace Holds vacancies functionality.
     */
    hh.vacancies = {};

    /**
     * @description Search vacancies by query, callback receive {@link hhSearchVacancy}.
     * @param query Hash with query params
     * @param callback CallBack function, receive {@link hhSearchVacancy}
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
            callback(new hhSearchVacancy(json, query));
        });
        utils.createScript({src: utils.createSrc('/vacancy/search/', query, callbackName)});
    };

    /**
     * @description Get employer vacancies, callback receive array of {@link hhVacancyShort}.
     * @param id Employer id
     * @param callback CallBack function, receive array of {@link hhVacancyShort}
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
            callback(json.map(hhVacancyShort));
        });
        utils.createScript({src: utils.createSrc('/vacancy/employer/' + id + '/', {}, callbackName)});
    };

    window[name] = hh;
})('hh');
