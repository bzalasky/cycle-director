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
    .startWith(getStartingURL(router))
    .map((event)=>{
      return "/" + router.getRoute();
    })
  }

  return Rx.Observable.merge(
    Rx.Observable.fromEvent(document, 'load'),
    Rx.Observable.fromEvent(window, 'hashchange')
  )
  .startWith(getStartingURL(router))
  .map((event) => {
    console.log(event);
    return "/" + router.getRoute();
  });
}

function getStartingURL(router) {
  let url;
  if (router.history) {
    url = window.location.pathname || "/";
  } else {
    url = window.location.hash.replace('#', '') || '/'
  }
  return url;
}

function addRoute(routes, route) {

  routes[route.url] = {
    once: route.once || ()=>{},
    before: route.before || ()=>{},
    on: route.on || ()=>{},
    after: route.after || ()=>{}
  }

}

function makeRouterDriver(routerOptions) {
  let router = new Router()
    .configure(routerOptions);

  return function(route$) {

    let routes = {};
    route$.subscribe(
    (route) => {
      addRoute(routes, route);
    },
    (err) => {
      console.log(err);
    },
    () => {
      router.mount(routes);
      router.init(getStartingURL(router));
    });

    let router$ = createRouter$(router);
    return router$
  }
}

export default makeRouterDriver;
export {makeRouterDriver};