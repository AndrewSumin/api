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
     * @private
     */
    function newShortVacancy (vacancy){
        vacancy.prototype = new hhShortVacancy(vacancy);
        return vacancy;
    }

    /**
     * @name hhShortVacancy
     * @constructor
     * @param {JSON} vacancy Short vacancy JSON
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
    var hhShortVacancy = function(self){
        var links = {};
        for (var i =0; i < self.link.length; i++){
            links[self.link[i].rel] = self.link[i];
            if (self.salary && self.salary.currency.__text){
                self.salary.currency.name = self.salary.currency__text;
            }
        }
        self.link = links;
        self.employer = newShortEmployer(self.employer);
    };
    hhShortVacancy.prototype = {
        /**
         * @description Hold employer functionality see {@link hhShortEmployer}
         * @type {Object}
         */
        employer: null,
        /**
         * @description Get {@link hhVacancy}
         */
        getVacancy: function(callback){
            hh.vacancy(this.id, callback);
        }
    };

    /**
     * @private
     */
    function newVacancy (vacancy){
        vacancy.prototype = new hhVacancy(newShortVacancy(vacancy));
        return vacancy;
    }
    /**
     * @name hhVacancy
     * @constructor
     * @param {JSON} vacancy Vacancy JSON
     */
    var hhVacancy = function (vacancy){
        vacancy.getVacancy = null;
    };
    hhVacancy.prototype = {
        /**
         * @description Hold employer functionality see {@link hhShortEmployer}
         * @type {Object}
         */
        employer: null,
        /**
         * @ignore
         */
        getVacancy: function(callback){
            hh.vacancy(this.id, callback);
        }
    };

    /**
     * @private
     */
    function newShortEmployer (employer){
        employer.prototype = new hhShortEmployer(employer);
        return employer;
    }
    /**
     * @name hhShortEmployer
     * @constructor
     * @param {JSON} vacancy Short employer JSON
     */
    var hhShortEmployer = function(json){};
    hhShortEmployer.prototype = {
        /**
         * @description Get list of {@link hhShortVacancy}
         * @param {Function} callback
         */
        getVacancies: function(callback){
            hh.vacancies.employer(this.id, callback);
        },
        /**
         * @description Get {@link hhEmployer}
         * @param {Function} callback
         */
        getEmployer: function(callback){
            hh.employer(this.id, callback)
        }
    };

    function newEmployer (employer){
        employer.prototype = new hhEmployer(employer);
        return employer;
    }
    /**
     * @name hhEmployer
     * @constructor
     * @param {JSON} vacancy Short employer JSON
     */
    var hhEmployer = function(json){};
    hhEmployer.prototype = {
        /**
         * @description Get list of {@link hhShortVacancy}
         * @param {Function} callback
         */
        getVacancies: function(callback){
            hh.vacancies.employer(this.id, callback);
        },
        /**
         * @ignore
         */
        getEmployer: null
    };

    var hhEmployerFull = function(json){
        json = hhShortEmployer(json)
        json.getFullInfo = null;
        return json;
    };

    /**
     * @ignore
     */
    var hhSearch = {
        /**
         * @private
         */
        _init: function(json, query){
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
     * @property {Array} vacancies List of {@link hhShortVacancy}
     * @property {Object} pager Pager, see {@link hhPager}
     * @property {Number} found number of {@link hhShortVacancy}
     * @param json JSON response from api
     * @param query Hash of query params
     */
    var hhSearchVacancy = function(json, query){
        this.vacancies = json.vacancies.map(newShortVacancy);
        this._init(json, query);
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
     * @example
     * &lt;!DOCTYPE html&gt;
     * &lt;html lang="ru-RU"&gt;
     *     &lt;head&gt;
     *         &lt;title&gt;JS API&lt;/title&gt;
     *         &lt;script type="text/javascript" src="api.js"&gt;&lt;/script&gt;
     *     &lt;/head&gt;
     *     &lt;body&gt;
     *         &lt;script&gt;
     *              function drawVacancy(vacancy){
     *                  return vacancy.name + '\n';
     *              }
     *              function callbackSearch(result){
     *                  alert(result.vacancies.map(drawVacancy).join(''));
     *              }
     *              function callbackEmployerVacancies(vacancyList){
     *                  alert(vacancyList.map(drawVacancy).join(''));
     *              }
     *              function callbackEmployer(employer){
     *                  alert(employer.name);
     *              }
     *
     *              // Get search result
     *              hh.vacancies.search({text:'javascript', region:[1, 2]}, callbackSearch);
     *
     *              // Get employer vacancies
     *              hh.vacancies.employer(1455, callbackEmployerVacancies);
     *
     *              // Get employer info
     *              hh.employer(1455, callbackEmployer);
     *         &lt;/script&gt;
     *     &lt;/body&gt;
     * &lt;/html&gt;
     */
    var hh = {};

    /**
     * @description Get employer info
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
            callback(newEmployer(json));
        });
        utils.createScript({src: utils.createSrc('/employer/' + id + '/', {}, callbackName)});
    };

    /**
     * @description Get vacancy info
     * @param {Number} id Vacancy id
     * @param {Function} callback
     * @example
     * hh.vacancy(1,
     *     function(vacancy){
     *         alert (vacancy.name)
     *     }
     * )
     */
    hh.vacancy = function(id, callback){
        var callbackName = utils.createCallback(function(json){
            callback(newVacancy(json));
        });
        utils.createScript({src: utils.createSrc('/vacancy/' + id + '/', {}, callbackName)});
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
     * @description Get employer vacancies, callback receive array of {@link hhShortVacancy}.
     * @param id Employer id
     * @param callback CallBack function, receive array of {@link hhShortVacancy}
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
            callback(json.map(newShortVacancy));
        });
        utils.createScript({src: utils.createSrc('/vacancy/employer/' + id + '/', {}, callbackName)});
    };

    window[name] = hh;
})('hh');
