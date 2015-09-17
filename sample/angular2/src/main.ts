import {CORE_DIRECTIVES, NgIf,Component, View, bootstrap} from "angular2/angular2";
import {HTTP_BINDINGS} from "angular2/http";
import {ROUTER_BINDINGS, HashLocationStrategy,
    LocationStrategy, Router, RouterLink, RouteConfig, RouterOutlet,
    RouteDefinition }
    from "angular2/router";
import {bind, Injectable} from "angular2/di";
import {LoggedInOnlyRoute,Visor} from "./visor";


import Home from "./home";
import Login from "./login";
import Admin from "./admin";
import Private from "./private";

@RouteConfig([
    {path: '/', as: "home", component:Home},
    {path: '/login', as: "login", component:Login},
    {path: '/admin', as: "admin", component:Admin},
    new LoggedInOnlyRoute({path: '/private', as: "private", component:Private})
])
@Component({
    selector: "app",
    bindings:[Visor]
})
@View({
    directives: [CORE_DIRECTIVES, RouterOutlet, RouterLink,NgIf],
    template: `
    <div class="navbar navbar-default">
        <div class="navbar-inner">
            <div class="collapse navbar-collapse">
                <ul class="nav navbar-nav navbar-left">
                    <li >
                        <a [router-link]="['/home']">Home</a>
                    </li>
                    <li  >
                        <a [router-link]="['/private']">Private</a>
                    </li>
                    <li >
                        <a [router-link]="['/admin']">Admin</a>
                    </li>
                </ul>
                <div class="nav navbar-nav navbar-right" *ng-if="!visor.loggedIn">
                    <a [router-link]="['/login']">Login</a>
                </div>
                <div class="nav navbar-nav navbar-right" *ng-if="visor.loggedIn">
                    You are logged in. <a >Logout</a>
                </div>
            </div>
        </div>
    </div>
    <router-outlet class="container"></router-outlet>
    `
})
class App {
    constructor(public visor:Visor){
        this.visor = visor;
        console.log(visor.loggedIn);
    }
}

bootstrap(App, [
    HTTP_BINDINGS,
    ROUTER_BINDINGS,
    bind(LocationStrategy).toClass(HashLocationStrategy)
]).then(
        success => console.log(`Bootstrap success`),
        error => console.log(error)
);