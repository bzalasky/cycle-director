import Rx from 'rx';
import {Router} from 'director';


function hijackLinks(router) {

  // Binds to new links if they are rerendered
  // Or just once if they never change
  Rx.Observable.fromEvent(document.body, 'DOMNodeInserted')
    .debounce(100)
    .subscribe((event) => {
      let links = document.querySelectorAll('a');

        Rx.Observable.fromEvent(links, 'click')
        .subscribe((event) => {
          event.preventDefault();

          let currentRoute = getStartingURL(router);
          let toRoute = event.target.href.replace(window.location.origin, '');

          if (toRoute !== currentRoute) {
            router.setRoute(event.target.href);
          }
        },
        (err) => console.log(err),
        () => {
          console.log('Complete');
        });
    })
}

function createRouter$(router) {

  if (router.history) {

    hijackLinks(router);

    // Find a better way
    return Rx.Observable.merge(
      Rx.Observable.fromEvent(document.body, 'click')
    )
  }

  return Rx.Observable.merge(
    Rx.Observable.fromEvent(document, 'load'),
    Rx.Observable.fromEvent(window, 'hashchange')
  );



}

function getCurrentUrl(router) {
  let url;
  if (router.history) {
    url = window.location.pathname || "/";
  } else {
    url = window.location.hash.replace('#', '') || '/'
  }
  return url;
}

function wrapHandler(handler, subject) {

  return (...params) => {
    if (typeof handler === "function") {
      subject.onNext(handler(...params));
    } else if (Array.isArray(handler)){
      handler.forEach((h) => {
        subject.onNext(h(...params))
      })
    }
  }

  
}


function addRoute(routes, route, subject) {

  routes[route.url] = {
    once: wrapHandler(route.once, subject),
    before: wrapHandler(route.before, subject),
    on: wrapHandler(route.on, subject),
    after: wrapHandler(route.after, subject)
  }

}

function wrapOptionsMethods(routerOptions, subject) {
  if (routerOptions.notfound) {
      routerOptions.notfound = wrapHandler(routerOptions.notfound, subject);
    } 

    if (routerOptions.on) {
      routerOptions.on = wrapHandler(routerOptions.on, subject);
    }

    if (routerOptions.before) {
      routerOptions.before = wrapHandler(routerOptions.before, subject);
    }

    if (routerOptions.after) {
      routerOptions.after = wrapHandler(routerOptions.after, subject);
    }
}

function makeRouterDriver(routerOptions) {

  let router = new Router()

  return function(route$) {
    let subject = new Rx.Subject();

    wrapOptionsMethods(routerOptions, subject)

    let routes = {};

    route$.subscribe(
    (route) => {
      addRoute(routes, route, subject);
    },
    (err) => {
      console.log(err);
    },
    () => {
      router.mount(routes);
      router.configure(routerOptions);
      if (routerOptions.before) {
        routerOptions.before();
      }
      router.init(getCurrentUrl(router));
    });

    
    return subject;
  }
}

export default makeRouterDriver;
export {makeRouterDriver};