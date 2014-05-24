#Visor

## Authentication and authorization library for angular.js

---

Visor is an authentication and authorization framework for [AngularJS](http://angularjs.org).  
It provides a convenient way to authenticate on startup and define which routes are accessible to whom.  
Visor works with both ngRoute and ui-router.

## Quick start

**Get Visor**:
 - [download the release](http://illniyar.github.io/visor/release/visor.js) (or [minified](http://illniyar.github.io/visor/release/visor.min.js))
 - via **[Bower](http://bower.io/)**: by running `$ bower install visor` from your console


###Authenticate with visor:


```
    angular.module("yourModule",["visor","ngRoute"]).
        configure(function(visorProvider,$routeProvider){
            visorProvider.authenticate = function($http){
                return $http.get(<your authentication url>).then(function(res){return res.data;}) //returns user
            };
            $routeProvider.when("/private",{
                restrict: function(user){ return user && user.can_see_private}
            })
        });
```

---

## Overview and Features

Visor provides two main features:

**Authentication**:
* Visor allows you to stop routing until an authentication request is made.
* Visor guarantees that authentication info is available (via visor.authInfo) before any restricted route is accessed.
* If a client is not authenticated and tries to access an authenticated only route, it will be redirected to a designated login route.
* After an unauthenticated client logsin/signsup, Visor makes sure to redirect the user back to the orignal route requested.

**Authorization**:
* Visor works with both ngRoute and ui-router, and allows to idiomatically restrict access to routes in either modules.
* Unauthorized users are sent to a dedicated "access denied" route.
* Restrictions are simple functions defined on routes/states which can access the user's authentication info.

---

## Usage

###Setting up the authenticate method

Visor requires that you define an authentication method that runs before restricted routes are accessed.  
Visor exposes an authenticate method in it's provider:

```
    angular.module("yourModule",["visor"]).
        configure(function(visorProvider,$routeProvider){
            visorProvider.authenticate = function($http){
                return $http.get(<your authentication url>).then(function(res){return res.data;})
            };
        });
```
The authenticate method is dependency injected, and needs to return a promise.  
The result from a successful promise will be sent to future restrict functions.

* By default Visor authenticates when the page is loaded even if a non restricted route is accessed,
  you can instruct Visor to only authenticate when a restricted route is accessed by setting the `visorProvider.authenticateOnStartup" flag.

###Defining restrictions on routes

To define certain routes to be restricted to certain users, Visor requires a "restrict" attribute to exist inside the route or state.  
That function will be called with the value returned from the `authenticate` promise and should return a boolean indicating if the routing should continue.  
If a user was not authenticated the restrict function will be called with no values.

#### ngRoute:

```
    angular.module("yourModule",["ngRoute"]).
        configure(function($routeProvider){
            $routeProvider.when("/private",{ // will only be shown to users that have `can_see_private`
                restrict: function(auth){ return auth && auth.can_see_private}
            })
            .when("/only_not_authenticated",{ // will only be shown to users who are not authenticated
                restrict: function(auth){ return auth === undefined}
            })
            .when("/public",{}); // will be shown to any user
        });
```

#### ui-router:
```
    angular.module("yourModule",["ui.router"]).
        configure(function($stateProvider){
            $stateProvider.state("private",{ // will only be shown to users that have `can_see_private`
                restrict: function(auth){ return auth && auth.can_see_private}
            })
            .state("only_not_authenticated",{ // will only be shown to users who are not authenticated
                restrict: function(auth){ return auth === undefined}
            })
            .state("public",{}); // will be shown to any user
        });
```

&nbsp;&nbsp;&nbsp;&nbsp; **Visor also respects restrictions in parent states.**  
```
    angular.module("yourModule",["ui.router"]).
        configure(function($stateProvider){
            $stateProvider.state("private",{ // will only be shown to users that have `can_see_private`
                restrict: function(auth){ return auth && auth.can_see_private}
            })
            .state("only_not_authenticated",{ // will only be shown to users that have `can_see_private`
                parent:"private"
            })
            .state("admin",{ // will only be shown to users who have both `can_see_private` and `is_admin`
                parent:"private",
                restrict: function(auth){ return auth && auth.is_admin}
            });
        });
```

**Visor provides two default restriction methods as constants**:
* `authenticatedOnly` - only users who are authenticated can see the route
* `notForAuthenticated` - only users who aren't authenticated can see the route

```
    angular.module("yourModule",["ngRoute"]).
        configure(function($routeProvider,authenticatedOnly,notForAuthenticated){
            $routeProvider.when("/private",{ // will only be shown to users that are authenticated
                restrict: authenticatedOnly
            })
            .when("/only_not_authenticated",{ // will only be shown to users who are not authenticated
                restrict: notForAuthenticated
            })
            .when("/public",{}); // will be shown to any user
        });
```

### Configuring actions on events

**Visor defines the following situations that can be overriden:**
* An unauthenticated user tries to access a restricted route.
    * By default Visor will redirect to `/login' path.
    * The path can be overriden in `visorProvider.loginRoute`
    * The action taken when such an event occurs can be overriden in `visorProvider.doOnNotAuthenticated`
    * Visor adds a `next` parameter to the redirect to allow returning to the original path after a successful login.
    * You can instruct Visor to not add the `next` parameter by  settings the `visorProvider.shouldAddNext` flag.

* An authenticated user tries to access a restricted route.
    * By default Visor will redirect to `/access_denied' path.
    * The path can be overriden in `visorProvider.notAuthorizedRoute`
    * The action taken when such an event occurs can be overriden in `visorProvider.doOnNotAuthorized`

* When a user is manually logged in.
    * By default if a `next` parameter exists in the url Visor will redirect to that path otherwise it'll redirect to `/' path.
    * The default path if no `next` is provided can be overriden in `visorProvider.homeRoute`
    * The action taken when such an event occurs can be overriden in `visorProvider.doAfterManualAuthentication`

###Login and Signup
Visor needs to be notified when a user logs in to the application (as opposed to already being authenticated) in order for restrictions to work.  
You inform visor when a user logs in by calling `visor.setAuthenticated(authInfo)`.  
The value sent to `visor.isAuthenticated` to be the same as the value returned in the `authenticate` promise.

