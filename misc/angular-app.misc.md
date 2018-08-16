## Review of angular-app

##### Bugs
- Neither 'largestNetworks' nor 'busiestNetworks' are highlighted at first
  when clicking either tab, nothing changes (data could be identical)
- A `PUT` request is sent to `<host>:3000/data` when fetching new data
- there are 2 methods hitting that endpoint (one `GET`, one `PUT`), why?
    - `<nmservice>.retrievePersistedDataForGraph` uses `GET` and 
      is called within `setInterval` each 3 seconds.
    - `<nmservice>.restructureAndPersistData` is the `PUT` sinner and
      is only run twice at the beginning before `setInterval`.
        - Why does it use PUT iso GET?
        - What is the `restructuredData` for?
        - Why `PUT` it to the server?
        - Why is it only called twice from home.component?

__NB! I think I figured out why `PUT`:__ This is where they derive the chart
data `restructuredData` from the original data -- and possibly 
they stored it in a MongoDB or similar at that endpoint.

##### home component cluttered
In `src/app/components/home/*`: &nbsp;

- HTML template contains too many details of 'largestNetworks' and 'busiestNetworks';
  could be separate component.
- `updateMetrics` method has much repeated and redundant code; error prone and messy.
  It calls `<nmservice>.updateCurrentMetrics`, then runs redunant methods on the service
  (already run within `<nmservice>.updateCurrentMetrics`), then typed out the 
  same sequense again within a `setInterval`- updating every 3 sec. 
- Methods `getIndexedNetworkAddress`, `getIndexedMetric` etc redundant. 
  Instead, access data directly in template and use `*ng-for` to repeat 4 times.
- d3 chart is placed in html `<footer>`, why?

##### REST endpoints
- Using 2 endpoints at `<host>:4567/info` and `<host>:3000/data`.
  Why use endpoints on differents ports?
- Data on 2nd enpoint is derived from 1st. 
  Reorganize data indstead within the browser?

##### net.metrics service over-complicated
In `src/app/services/net.metrics/*`. Particularly `net.metrics.service.ts`: &nbsp;

- `updateCurrentMetrics` method gets data from server, plain and simple
- `updateLargestNetworks` algorithm unclear; why so complex?
- `updateBusiestNetworks` algorithm unclear; why so complex?
- `updateTotalsAndComparativeMetrics` is called only from home.component.
  resets `largestNetworks`, `busiesNetworks` and other properties
  then proceeds to update them with said complex algorithm; and update `users, numTotalChannels`


##### d3 graphics over-complicated
The small d3 chart is spread out on a total of __19 files!__
I suggest a re-write and to simplify that big time. For example, the chart 
can be created without angular; then just include it in the simplest 
possible way, ie as a separate script tag on the `index.html`.

7 files in 3 angular sub components:

```
    src/app/components/visuals/
    ├── graph
    │   ├── graph.component.css
    │   └── graph.component.ts
    └── shared
        ├── index.ts
        ├── link-visual
        │   ├── link-visual.component.css
        │   └── link-visual.component.ts
        └── node-visual
            ├── node-visual.component.css
            └── node-visual.component.ts
```

And 9 files in in `app/src/services/d3`:
(is this even a "service"? IMO angular services provide data, not UI functionality as this does?)

```
    src/app/services/d3/
    ├── d3.service.ts
    ├── directives
    │   ├── draggable.directive.ts
    │   ├── index.ts
    │   └── zoomable.directive.ts
    ├── index.ts
    └── models
        ├── force-directed-graph.ts
        ├── index.ts
        ├── link.ts
        └── node.ts
```

And another 3 files in `src/app/services/graph.visual/`:

```
    src/app/services/graph.visual/
    ├── graph.component.css
    ├── graph.component.html
    └── graph.visual.service.ts
```
