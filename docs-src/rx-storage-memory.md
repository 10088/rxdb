# Memory RxStorage (beta)

The Memory `RxStorage` is based on plain in memory arrays and objects. It can be used in all environments and is made for performance.


### Pros

- Really fast. Uses binary search on all operations.
- Small build size

### Cons

- No persistence
- No CouchDB replication
- Does not support [attachments](./rx-attachment.md).



```ts
import {
    createRxDatabase
} from 'rxdb';
import {
    getRxStorageMemory
} from 'rxdb-premium/plugins/memory';

const db = await createRxDatabase({
    name: 'exampledb',
    storage: getRxStorageMemory()
});
```


--------------------------------------------------------------------------------

If you are new to RxDB, you should continue [here](./rx-storage-indexeddb.md)
