# zoo-lock

zookeeper locking using [node-zookeeper-client](https://github.com/alexguan/node-zookeeper-client)

The library exposes a single function, `createClient` which creates zookeeper client instance.

All locks are stored in a folder which has to be set by client using `setDir` method, through which `getZooLock` method is exposed where path is specified for locking.

Locks must be released with the `release` method return while applying lock.


## ZookeeperLock

### install
usage: 
```
  npm i zoo-lock
```

### constructor
usage: 
```
  import createClient from "zoo-lock";

  const client = await createClient("localhost:2181", {
    logger: console,
  });
  
```


### lock and unlock
usage:
```
    const zooUnLock = await client
      .setDir("/test2")
      .getZooLock("/mylock")

    // perform some task
    // above method can throw error if it could not get lock

    await zooUnLock.release();
```



