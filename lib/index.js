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

      var currentRoute = getCurrentUrl(router);
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

function getCurrentUrl(router) {
  var url = undefined;
  if (router.history) {
    url = window.location.pathname || "/";
  } else {
    url = window.location.hash.replace('#', '') || '/';
  }
  return url;
}

function wrapHandler(handler, subject) {

  return function () {
    for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }

    if (typeof handler === "function") {
      subject.onNext(handler.apply(undefined, params));
    } else if (Array.isArray(handler)) {
      handler.forEach(function (h) {
        subject.onNext(h.apply(undefined, params));
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

  var router = new _director.Router();

  return function (route$) {
    var subject = new _rx2['default'].Subject();

    wrapOptionsMethods(routerOptions, subject);

    var routes = {};

    route$.subscribe(function (route) {
      addRoute(routes, route, subject);
    }, function (err) {
      console.log(err);
    }, function () {
      router.mount(routes);
      router.configure(routerOptions);

      if (routerOptions.before) {
        routerOptions.before();
      }

      if (router.history) {
        hijackLinks(router);
      }

      router.init(getCurrentUrl(router));
    });

    return subject;
  };
}

exports['default'] = makeRouterDriver;
exports.makeRouterDriver = makeRouterDriver;
