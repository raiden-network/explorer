## angular-app thoughts

##### Bugs
  - neither 'largestNetworks' nor 'busiestNetworks' are highlighted at first
    when clicking either tab, nothing changes (data could be identical)
  - a `PUT` request is sent to `<host>:3000/data` when fetching new data
  - there are 2 methods hitting that endpoint (oen `GET`, one `PUT`), why?

##### home component cluttered - `src/app/components/home/*`
  - HTML template contains too many details of 'largestNetworks' and 'busiestNetworks';
    could be separate component.
  - `updateMetrics` method has much repeated and redundant code; error prone and messy.
    It calls `service.updateCurrentMetrics`, then runs redunant methods on the service
    (they are run within `updateCurrentMetrics`), then typed the same sequense again
    within a `setInterval`- updating every 3 sec. 
  - Methods `getIndexedNetworkAddress`, `getIndexedMetric` etc redundant. 
    Access data directly in template and use ng-for to repeat 4 times.


  - d3 chart is placed in `<footer>`, why?

##### REST endpoints
  using 2 entpoints at `<host>:4567/info` and `<host>:3000/data`
    why use enpoints on differents ports?
  data on 2nd enpoint is derived from 1st
    reorganize data indstead within the browser?

##### net.metrics service over-complicated - `src/app/services/net.metrics/*`
  particularly `net.metrics.service.ts`
    - `updateCurrentMetrics` method gets data from server, plain and simple
    - `updateLargestNetworks` algorithm unclear; why so complex?
    - `updateBusiestNetworks` algorithm unclear; why so complex?
    - `updateTotalsAndComparativeMetrics` is called only from home.component.
      resets `largestNetworks`, `busiesNetworks` and other properties
      then proceeds to update them  with said complex algorithm; and update `users, numTotalChannels`


##### d3 graphics over-complicated
  the small d3 chart is spread out on 7 files in 3 angular sub components
    `link-visual.., node-visual.., graph.component`

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

  plus 9 files in in `app/src/services/d3`:
    (is this even a "service"? IMO ng services provide data, not functionality as this does?)
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
  and another 3 files in `src/app/services/graph.visual/`:
  ```
    src/app/services/graph.visual/
    ├── graph.component.css
    ├── graph.component.html
    └── graph.visual.service.ts
  ```
