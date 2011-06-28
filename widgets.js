(function(){
    if (window.hh){
        return;
    }
    window.hh = {_callbacks:[], onload:function(callback){this._callbacks.push(callback);}};
    
    var hh = window.hh;
    
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('charset', 'utf-8');
    script.setAttribute('src', 'api.js');
    var head = document.getElementsByTagName('head').item(0);
    head.insertBefore(script, head.firstChild);

    var link = document.createElement('link');
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('charset', 'utf-8');
    link.setAttribute('href', 'style.css');
    head = document.getElementsByTagName('head').item(0);
    head.insertBefore(link, head.firstChild);


    document.createElement('hh');
    document.createElement('hhelement');
    
    function find(){
        var i = 0,
            elements = document.body.getElementsByTagName('hh');
        while(elements.item(i)){
            create(elements.item(i));
            i++;
        }
    }
    
    function create(element){
        new Widget(element, new Function ('return ' + element.getAttribute('data-config'))());
    }

    hh.onload(function(){
        if (document.readyState === 'complete'){
            find();
        } else {
            document.addEventListener('readystatechange', function(state){
                if (document.readyState === 'complete'){
                    find();
                }
            }, false);
        }
    });
    
    function Widget(element, config){
        this.init(element, config);
    }
    
    Widget.prototype = {
        init: function(element, config){
            this.element = element;
            this.config = config;
            
            this.element.style.width = this.config.style ? this.config.style.width || 'auto' : 'auto';
            this.element.style.height = this.config.style ? this.config.style.height || 'auto' : 'auto';
            //this.element.style.overflowY = 'auto';
            this.element.className = 'hh-' + (this.config.scheme || 'light');
            
            if (this.config.type == 'vacancies' && this.config.source == 'employer'){
                this.vacancies_employer(this.config.query);
            }
            
            this.element.addEventListener('click', function(event){
                if (event.target.getAttribute('href')){
                    window.location.assign(event.target.getAttribute('href'));
                }
            }, false);

        },
        draw_vacancy: function(vacancy){
            console.log(vacancy.name, vacancy);
            return '<hhelement class="hh-vacancy">' + 
                       '<hhelement class="hh-vacancy__name" title="' + vacancy.links.alternate.href + '" href="' + vacancy.links.alternate.href + '">' + vacancy.name + '</hhelement>' + 
                       (vacancy.salary
                           ? '<hhelement class="hh-salary">' + 
                                 (vacancy.salary.from ? 'от ' + vacancy.salary.from : '') +
                                 (vacancy.salary.from && vacancy.salary.to ? ' ' : '') +
                                 (vacancy.salary.to ? 'до ' + vacancy.salary.to : '') +
                                 ' ' +
                                 (vacancy.salary.currency.name ? vacancy.salary.currency.name : vacancy.salary.currency.code) +
                             '</hhelement>'
                           : '<hhelement class="hh-salary hh-salary_notset">з/п не указанна</hhelement>') +
                   '</hhelement>';
        },
        draw_vacancies: function(vacancies){
            this.element.innerHTML = vacancies.join('');
            
        },
        vacancies_employer: function(id){
            hh.vacancies.employer(id)
                        .iterate(this.draw_vacancy.bind(this), this.draw_vacancies.bind(this));
        }
    };
})();

