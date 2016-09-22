# fsweb

static http server with live reload on save.

```
> fsweb ./ 5000
```
## install
```
npm install fsweb -g
```

## overview

fsweb is a simple command line utility to quickly serve static content over http and
provides automatic live reload functionality whenever content in the directory changes.

fsweb has been tested in internet explorer, firefox, chrome, opera and edge browsers.

## starting the server

If not stated otherwise, fsweb will serve content from the current working directory on port 5000

```
> fsweb
```

Users can override the path and the port as follows.

```
> fsweb ./directory_to_watch 8080
```
which will serve/watch this directory and listen on port 8080. 

Alternatively
```
> fsweb 8080
```
will watch the current working directory on port 8080.




