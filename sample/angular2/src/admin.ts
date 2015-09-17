/// <reference src="typings/tsd.d.ts">

import {Component, View, bootstrap} from "angular2/angular2";
import {RouteLifecycleHook} from "angular2/router";
import {CONST, CONST_EXPR} from 'angular2/src/core/facade/lang';
import {FORM_DIRECTIVES} from 'angular2/forms'

@Component({
    selector: "admin"
})
@View({
    template:`
        You are at admin!
    `
})
export default class Home implements new RouteLifecycleHook("CanActivate") {
    name:string = "Admin";

    onActivate(next, prev) {
        console.log("!!!")
        this.log = 'Finished navigating from ' + prev.urlPath + ' to ' + next.urlPath;
    }
}