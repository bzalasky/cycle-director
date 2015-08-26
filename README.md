# Cycle-Director

This is a first attempt a making a router driver for [cycle.js](http://cycle.js.org) using [director](https://github.com/flatiron/director)

# Install

```
npm install cycle-director
```

# Client Example

```
import {run, Rx} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

import {makeClientDriver} from 'cycle-director';

let author = () => { return "author" };
let books = () => { return "books"};
let viewBook = (id) => {return "viewBook: bookId is populated: " + id};
let viewChapter = (bookId, chapterNumber) => { return "BookId: " + bookId + " Chapter: " + chapterNumber}

let routes = [
  { url: "/author",
    on: author,
    after: () => {if (!confirm("You sure you want to leave this page?")) {
      window.location.hash = '#/author'
    }}
  },
  { url: "/books", on: [books, () => { return "An inline route handler"}]},
  { url: "/books/view/:bookId", on: viewBook},
  { url: "/books/view/:bookId/chapter/:chapterNumber", on: viewChapter }
]

function render(text) {
  return h('div', [
    h('ul', [
      h('li', [h('a', {href: '#/author'}, 'Author')]),
      h('li', [h('a', {href: '#/books'}, 'Books')]),
      h('li', [h('a', {href: '#/books/view/33'}, 'Book 33')]),
      h('li', [h('a', {href: '#/books/view/33/chapter/2'}, 'Book 33 Chapter 2')])
    ]),
    h ('h1', text)
  ])
}

function main({DOM, Router}){
  let route$ = Rx.Observable.from(routes);

  let view$ = Router
    .map((output) => {
      console.log("Output: " + output);
      return render(output);
    })

  return {
    DOM: view$,
    Router: route$
  };
}


let drivers = {
  DOM: makeDOMDriver('.app'),
  Router: makeRouterDriver({
    html5history: false,
    notfound: () => { return 'Page can not be found'}
  })
};

run(main, drivers);
```
# API

### makeRouterDriver(options)

###### Arguments
  options - options are all configuration options supported by [director](https://github.com/flatiron/director#routing-events)

###### Return
(Function) The Router Driver function. It expects an Observable of Route Objects as input, and outputs the path of the current route.

### Route Object

- url (required): path to mount routing events

- optionally any [routing event](https://github.com/flatiron/director#configuration) director supports

# Server Side Example
### Uses [cycle-http-server](https://github.com/tylors/cycle-http-server)
```javascript
import {run} from '@cycle/core';
import {makeServerDriver} from 'cycle-http-server';
import {makeHTTPDriver} from 'cycle-director';

function helloWorld() {
  this.res.writeHead(200, {'Content-Type': 'text/plain'});
  this.res.end("Hello, world!");
}

let routes = {
  "/hello": {
    get: helloWorld
  }
};

function main({Server, Router}) {

  Server.subscribe( ({req, res}) => {
    Router.dispatch(req, res, (err) => {
      if (err) {
        res.writeHead(404);
        res.end(err.toString());
      }
    }
  })

  Router.get("/bonjour", helloWorld);
  Router.get("/hola/", helloWorld);

  Server.listen(3000);
}

let drivers = {
  // Takes routes and [configuration](https://github.com/flatiron/director#configuration)
  Router: makeHTTPDriver(routes, {
    strict: false
  }),
  Server: makeServerDriver()
}

run(main,drivers);
```
