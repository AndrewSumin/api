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
    
    var // Promise methods
        promiseMethods = "done fail isResolved isRejected promise then always pipe".split( " " ),
        // Static reference to slice
        sliceDeferred = [].slice;

    var hh = {
        // Create a simple deferred (one callbacks list)
        _Deferred: function() {
            var // callbacks list
                callbacks = [],
                // stored [ context , args ]
                fired,
                // to avoid firing when already doing so
                firing,
                // flag to know if the deferred has been cancelled
                cancelled,
                // the deferred itself
            deferred  = {

                // done( f1, f2, ...)
                done: function() {
                    if ( !cancelled ) {
                        var args = arguments,
                            i,
                            length,
                            elem,
                            type,
                            _fired;
                        if ( fired ) {
                            _fired = fired;
                            fired = 0;
                        }
                        for ( i = 0, length = args.length; i < length; i++ ) {
                            elem = args[ i ];
                            if ( typeof elem === "object" ) {
                                deferred.done.apply( deferred, elem );
                            } else if ( typeof elem === "function" ) {
                                callbacks.push( elem );
                            }
                        }
                        if ( _fired ) {
                            deferred.resolveWith( _fired[ 0 ], _fired[ 1 ] );
                        }
                    }
                    return this;
                },

                // resolve with given context and args
                resolveWith: function( context, args ) {
                    if ( !cancelled && !fired && !firing ) {
                        // make sure args are available (#8421)
                        args = args || [];
                        firing = 1;
                        try {
                            while( callbacks[ 0 ] ) {
                                callbacks.shift().apply( context, args );
                            }
                        }
                        finally {
                            fired = [ context, args ];
                            firing = 0;
                        }
                    }
                    return this;
                },

                // resolve with this as context and given arguments
                resolve: function() {
                    deferred.resolveWith( this, arguments );
                    return this;
                },

                // Has this deferred been resolved?
                isResolved: function() {
                    return !!( firing || fired );
                },

                // Cancel
                cancel: function() {
                    cancelled = 1;
                    callbacks = [];
                    return this;
                }
            };

            return deferred;
        },

        // Full fledged deferred (two callbacks list)
        Deferred: function( func ) {
            var deferred = hh._Deferred(),
                failDeferred = hh._Deferred(),
                promise;
            // Add errorDeferred methods, then and promise
            deferred.then = function( doneCallbacks, failCallbacks ) {
                deferred.done( doneCallbacks ).fail( failCallbacks );
                return this;
            };
            deferred.always = function() {
                return deferred.done.apply( deferred, arguments ).fail.apply( this, arguments );
            };
            deferred.fail = failDeferred.done;
            deferred.rejectWith = failDeferred.resolveWith;
            deferred.reject = failDeferred.resolve;
            deferred.isRejected = failDeferred.isResolved;
            deferred.pipe = function( fnDone, fnFail ) {
                return hh.Deferred(function( newDefer ) {
                    var methods = {
                        done: [ fnDone, "resolve" ],
                        fail: [ fnFail, "reject" ]
                    }
                    for (i in methods){
                        map (i, methods[i]);
                    }
                    function map ( handler, data ) {
                        var fn = data[ 0 ],
                            action = data[ 1 ],
                            returned;
                        if ( typeof fn == 'function' ) {
                            deferred[ handler ](function() {
                                returned = fn.apply( this, arguments );
                                if ( returned && typeof returned.promise == 'function' ) {
                                    returned.promise().then( newDefer.resolve, newDefer.reject );
                                } else {
                                    newDefer[ action ]( returned );
                                }
                            });
                        } else {
                            deferred[ handler ]( newDefer[ action ] );
                        }
                    };
                }).promise();
            };
            // Get a promise for this deferred
            // If obj is provided, the promise aspect is added to the object
            deferred.promise = function( obj ) {
                if ( obj == null ) {
                    if ( promise ) {
                        return promise;
                    }
                    promise = obj = {};
                }
                var i = promiseMethods.length;
                while( i-- ) {
                    obj[ promiseMethods[i] ] = deferred[ promiseMethods[i] ];
                }
                return obj;
            }
            // Make sure only one callback list will be used
            deferred.done( failDeferred.cancel ).fail( deferred.cancel );
            // Unexpose cancel
            delete deferred.cancel;
            // Call given func if any
            if ( func ) {
                func.call( deferred, deferred );
            }
            return deferred;
        },

        // Deferred helper
        when: function( firstParam ) {
            var args = arguments,
                i = 0,
                length = args.length,
                count = length,
                deferred = length <= 1 && firstParam && typeof firstParam.promise == 'function' ?
                    firstParam :
                    hh.Deferred();
            function resolveFunc( i ) {
                return function( value ) {
                    args[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
                    if ( !( --count ) ) {
                        // Strange bug in FF4:
                        // Values changed onto the arguments object sometimes end up as undefined values
                        // outside the $.when method. Cloning the object into a fresh array solves the issue
                        deferred.resolveWith( deferred, sliceDeferred.call( args, 0 ) );
                    }
                };
            }
            if ( length > 1 ) {
                for( ; i < length; i++ ) {
                    if ( args[ i ] && typeof args[ i ].promise == 'function' ) {
                        args[ i ].promise().then( resolveFunc(i), deferred.reject );
                    } else {
                        --count;
                    }
                }
                if ( !count ) {
                    deferred.resolveWith( deferred, args );
                }
            } else if ( deferred !== firstParam ) {
                deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
            }
            return deferred.promise();
        }
    }


    hh.vacancies = {};

    hh.vacancies.search = function(query) {
        var dfd = new hh.Deferred();
        var callbackName = utils.createCallback(function(json){
            dfd.resolve(json);
        });
        utils.createScript({src: utils.createSrc('/vacancy/search/', query, callbackName)});
        return dfd.promise({
            found: function(callback){
                this.finish = undefined;
                this.done(function(json){callback(json.found)});
                return this;
            },
            iterate: function(callback){
                var result = [];
                this.done(function(json){
                    for (var i = 0, l = json.vacancies.length; i < l; i++){
                        result.push(callback(json.vacancies[i], i, json.vacancies));
                    }
                });
                this.finish = function(callback){
                    this.done(function(){callback(result)});
                    return this;
                }
                return this;
            }
        });
    };

    window[name] = hh;

})('hh');
