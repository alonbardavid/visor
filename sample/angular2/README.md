#I Failed!

One of the main reasons to use Visor is that you can declare restricted urls where you declare routes.

i.E.

```
@RouteConfig([
    {path: '/', as: "home", component:Home},
    {path: '/login', as: "login", component:Login},
    {path: '/admin', as: "admin", component:Admin, restricted: AdminOnly},
    {path: '/private', as: "private", component:Private, restricted: true}
])
```

But the new router and angular2 in general has no good way to decorate or extend functionality from
outside the component (unlike hooks), while this may be a design decision, it makes Visor pretty useless.