# Cycle-Director

This is a first attempt a making a router driver for [cycle.js](http://cycle.js.org) using [director](https://github.com/flatiron/director)

# Install

```
npm install cycle-director
```

# Example

```
import {run, Rx} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

import makeRouterDriver from 'cycle-director';

let home_route = {
  url: '/',
  before: ()=>{console.log("Going home...")},
  on: ()=>{console.log("Welcome home")},
  after: ()=>{console.log("Leaving home...")},
  view: () => {
    return h('div', [
             h('a', {href: '/'}, 'Home'),
             h('a', {href:'/about'}, 'About'),
             h('h1', 'Welcome Home')
           ])
  }
}

let about_route = {
  url: "/about",
  on: ()=>{console.log("About this page...")},
  view: () => {
    return h('div', [
             h('a', {href: '/'}, 'Home'),
             h('a', {href:'/about'}, 'About'),
             h('h1', 'About me')
           ])
  }
}

let routes = [
  home_route,
  about_route
]


function main({DOM, Router}){
  let route$ = Rx.Observable.from(routes);

  let view$ = Router
  .map((currentRoute) => {
    let view;
    routes.forEach((route) => {
      if (route.url === currentRoute) {
        view = route.view()
      }
    })
    return view
  })

  return {
    DOM: view$,
    Router: route$
  };
}


let drivers = {
  DOM: makeDOMDriver('.app'),
  Router: makeRouterDriver({
    html5history: true // Remember to setup your server to handle this
  })
};

run(main, drivers);
```
# API

### makeRouterDriver(options)

###### Arguments
  options - options are all configuration options supported by [director](https://github.com/flatiron/director##routing-events)

###### Return
(Function) The Router Driver function. It expects an Observable of Route Objects as input, and outputs the path of the current route.

### Route Object

- url (required): path to mount routing events

- optionally any [routing event](https://github.com/flatiron/director#configuration) director supports

  ###### Example Route Object
  ```
    {
      url: '/home', // required
      before: () => console.log('Going home...'), // optional
      once: () => console.log('Never been here before'), // optional
      on: () => console.log('Welcome home...'), // optional
      after: () => console.log('Leaving home...') // optional
    }
  ```
- anything else: Its just a javascript object. Put whatever else you may need to complete your application. These are just the things that cycle-director will do something with.
