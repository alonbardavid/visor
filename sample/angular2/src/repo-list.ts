/// <reference src="typings/tsd.d.ts">
import {NgFor, Component, View, bootstrap} from "angular2/angular2";
import {Http} from "angular2/http";

const REPOS = `https://api.github.com/users/angular/repos`;

@Component({
    selector: "repo-list"
})
@View({
    directives: [NgFor],
    template: `
    <div *ng-for="#repo of repos">
        {{repo.name}}, id: {{repo.id}}
    </div>
`
})
export default class RepoList {
    repos: any[] = [];

    constructor(http:Http) {
        //waiting for RxNext to release before API stabilizes...
        http.get(REPOS).toRx().subscribe(
                res => this.repos = res.json()
        )
    }
}