import {RouteDefinition} from "angular2/router";
import { Injectable} from "angular2/di";

@Injectable()
export class Visor {
    loggedIn: Boolean = false;
    isAdmin: Boolean = false;

    public logIn(isAdmin){
        this.loggedIn = true;
        this.isAdmin = isAdmin;
    }
    public logOut(){
        this.loggedIn = false;
    }
}
export class LoggedInOnlyRoute implements RouteDefinition {
    data: any;
    path: string;
    component: Type;
    as: string;
    // added next two properties to work around https://github.com/Microsoft/TypeScript/issues/4107
    loader: Function;
    redirectTo: string;
    constructor({path, component, as, data}:
        {path: string, component: Type, as?: string, data?: any}) {
        this.path = path;
        this.component = component;
        this.as = as;
        this.loader = null;
        this.redirectTo = null;
        this.data = data;
    }
}