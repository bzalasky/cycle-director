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

let author = () => { return "author" };
let books = () => { return "books"};
let viewBook = (id) => {return "viewBook: bookId is populated: " + id};
let viewChapter = (bookId, chapterNumber) => { return "BookId: " + bookId + " Chapter: " + chapterNumber} 

let routes = [
  { url: "/author",  
    on: author,
    after: () => {confirm("You sure you want to leave this page?")}
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
