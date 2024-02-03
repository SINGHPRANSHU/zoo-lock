# zoo-lock

This package provides zookeeper locking following [ZooKeeper Recipes and Solutions](https://zookeeper.apache.org/doc/r3.1.2/recipes.html)
 using [node-zookeeper-client](https://github.com/alexguan/node-zookeeper-client)

The library exposes a single function, `createClient` which creates zookeeper client instance.

All locks are stored in a folder which has to be set by client using `setDir` method, through which `getZooLock` method is exposed where path is specified for locking.

Locks must be released with the `release` method which is returned while applying lock.


## ZookeeperLock

### Install
usage: 
```
  npm i zoo-lock
```

### Initialize
usage: 
```
  import createClient from "zoo-lock";

  const client = await createClient("localhost:2181", {
    logger: console,
  });
  
```


### Lock And Unlock
usage:
```
    const zooUnLock = await client
      .setDir("/test2")
      .getZooLock("/mylock")

    // perform some task
    // above method can throw error if it could not get lock

    await zooUnLock.release(); // it can also throw error
```


### Get Node-Zookeeper-Client Object

if for some reason you need node-zookeeper-client object it is accessible through getClient method

usage:
```
    const nodeZookeeperClient = client.getClient()
```


## Lock Options

### Timeouts
Timeout can be set for locks through ZooLockOption where timeout is calculated by overall time between creating and removing node.

getZooLock method could also throw error if due to timeout node was already removed.

release method could also throw error if due to timeout node was already removed
usage:
```
    const zooUnLock = await client
      .setDir("/test2")
      .getZooLock("/mylock", { timeout: 3000 })   // timeout in ms

    await zooUnLock.release();
```

## Develop

Build using `npm run build`.

Run test using `npm run test`.

running test require zookeeper instance running. 

