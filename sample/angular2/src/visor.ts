import {RouteDefinition} from "angular2/router";


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