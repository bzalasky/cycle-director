'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _director = require('director');

function hijackLinks(router) {

  // Binds to new links if they are rerendered
  // Or just once if they never change
  _rx2['default'].Observable.fromEvent(document.body, 'DOMNodeInserted').debounce(100).subscribe(function (event) {
    var links = document.querySelectorAll('a');

    _rx2['default'].Observable.fromEvent(links, 'click').subscribe(function (event) {
      event.preventDefault();

      var currentRoute = getStartingURL(router);
      var toRoute = event.target.href.replace(window.location.origin, '');

      if (toRoute !== currentRoute) {
        router.setRoute(event.target.href);
      }
    }, function (err) {
      return console.log(err);
    }, function () {
      console.log('Complete');
    });
  });
}

function createRouter$(router) {

  if (router.history) {

    hijackLinks(router);

    // Find a better way
    return _rx2['default'].Observable.merge(_rx2['default'].Observable.fromEvent(document.body, 'click')).startWith(getStartingURL(router)).map(function (event) {
      return "/" + router.getRoute();
    });
  }

  return _rx2['default'].Observable.merge(_rx2['default'].Observable.fromEvent(document, 'load'), _rx2['default'].Observable.fromEvent(window, 'hashchange')).startWith(getStartingURL(router)).map(function (event) {
    console.log(event);
    return "/" + router.getRoute();
  });
}

function getStartingURL(router) {
  var url = undefined;
  if (router.history) {
    url = window.location.pathname || "/";
  } else {
    url = window.location.hash.replace('#', '') || '/';
  }
  return url;
}

function addRoute(routes, route) {

  routes[route.url] = {
    once: route.once || function () {},
    before: route.before || function () {},
    on: route.on || function () {},
    after: route.after || function () {}
  };
}

function makeRouterDriver(routerOptions) {
  var router = new _director.Router().configure(routerOptions);

  return function (route$) {

    var routes = {};
    route$.subscribe(function (route) {
      addRoute(routes, route);
    }, function (err) {
      console.log(err);
    }, function () {
      router.mount(routes);
      router.init(getStartingURL(router));
    });

    var router$ = createRouter$(router);
    return router$;
  };
}

exports['default'] = makeRouterDriver;
exports.makeRouterDriver = makeRouterDriver;
