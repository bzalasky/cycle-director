import Rx from 'rx';
import {Router, http} from 'director';

function pushStateClick() {
  return click(document)
    .map((event) => {
      event.preventDefault();

      return event.target;
    })
    .filter((el) => el.matches('a[href^="/"]'))
    .subscribe((anchor) => {
      let currentRoute = getCurrentUrl(anchor.href);
      let toRoute = anchor.href.replace(window.location.origin, '');

      if (toRoute !== currentRoute) {
        router.setRoute(anchor.href);
      }
    }, (err) => console.log(err));
}

function getCurrentUrl(router) {
  let url;

  if (router.history) {
    url = window.location.pathname || "/";

  } else {
    url = window.location.hash.replace('#', '') || '/';
  }

  return url;
}

function wrapHandler(handler, subject) {
  return (...params) => {
    if (typeof handler === "function") {
      subject.onNext(handler(...params));

    } else if (Array.isArray(handler)) {
      handler.forEach((h) => {
        subject.onNext(h(...params));
      });
    }
  };
}

function addRoute(routes, route, subject) {
  routes[route.url] = {
    once: wrapHandler(route.once, subject),
    before: wrapHandler(route.before, subject),
    on: wrapHandler(route.on, subject),
    after: wrapHandler(route.after, subject)
  };
}

function addServerRoute(routes, route) {
  routes[route.url] = {
    before: route.before,
    on: route.on,
    get: route.get,
    post: route.post,
    put: route.put,
    delete: route.delete
  };
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

function makeClientDriver(routerOptions) {
  let router = new Router();

  return function(route$) {
    let subject = new Rx.Subject();
    let routes = {};

    wrapOptionsMethods(routerOptions, subject);

    route$.subscribe(
      (route) => {
        addRoute(routes, route, subject);

      }, (err) => {
        console.log(err);

      }, () => {
        router.mount(routes);
        router.configure(routerOptions);

        if (routerOptions.before) {
          routerOptions.before();
        }

        if (router.history) {
          pushStateClick(router);
        }

        router.init(getCurrentUrl(router));
      });

    return subject;
  };
}

function makeHTTPDriver(routes, routerOptions = {}) {
  let router = new http.Router(routes).configure(routerOptions);

  return () => router;
}

export default makeClientDriver;

export {makeClientDriver, makeHTTPDriver};
