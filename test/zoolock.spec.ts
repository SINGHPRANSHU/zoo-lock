import createClient from "../src";
import { ZooLockOption } from "../src/zooLock";
import { zoolockDir } from "../src/zooLockDir";

const ZooKeeperUrl = "localhost:2181";

async function main(client: zoolockDir, options: ZooLockOption, dir: string) {
  const unlock = await client.setDir(dir).getZooLock("/hello", options);
  return await new Promise((res, rej) => {
    setTimeout(() => {
      unlock
        .release()
        .then(() => res(true))
        .catch(() => {                    
          rej(false);
        });
    }, 2000);
  });
}

test("should throw error due to wrong node name", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  await expect(main(client, {timeout: 1000}, "test"))
    .rejects.toEqual(new Error('dir should start with /'))
    .finally(() => zookeeperClient.close());
});

test("should throw error due to timeout", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  await expect(main(client, {timeout: 1000}, "/test"))
    .rejects.toEqual(false)
    .finally(() => zookeeperClient.close());
});

test("should not throw error due to timeout", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  await expect(main(client, {timeout: 10000}, "/test"))
    .resolves.toEqual(true)
    .finally(() => zookeeperClient.close());
});

test("one out of two lock should throw error", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  const [res1, res2] = await Promise.allSettled([
    main(client, {timeout: 1000}, "/test"),
    main(client, {timeout: 10000}, "/test"),
  ]);
  expect(res1.status).toEqual("rejected");
  expect(res2.status).toEqual("fulfilled");
  zookeeperClient.close();
});
test("two out of two lock should throw error", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  const [res1, res2] = await Promise.allSettled([
    main(client, {timeout: 1000}, "/test"),
    main(client, {timeout: 1000}, "/test"),
  ]);
  expect(res1.status).toEqual("rejected");
  expect(res2.status).toEqual("rejected");
  zookeeperClient.close();
});

test("one out of two lock should throw error due to max lock limit", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  const [res1, res2] = await Promise.allSettled([
    main(client, {}, "/test"),
    new Promise((res, rej) => setTimeout(() => {
      main(client, {maxChildLockLimit: 1}, "/test").then(() => res(true)).catch(() => rej(false))
    }, 500))
  ]);  
  expect(res1.status).toEqual("fulfilled");
  expect(res2.status).toEqual("rejected");
  zookeeperClient.close();
});

test("two out of two lock should throw error due to max lock limit", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  const initialLock = main(client, {}, "/test");
  const [res1, res2] = await Promise.allSettled([
    new Promise((res, rej) => setTimeout(() => {
      main(client, {maxChildLockLimit: 1}, "/test").then(() => res(true)).catch(() => rej(false))
    }, 500)),
    new Promise((res, rej) => setTimeout(() => {
      main(client, {maxChildLockLimit: 1}, "/test").then(() => res(true)).catch(() => rej(false))
    }, 500))
  ]);  
  expect(res1.status).toEqual("rejected");
  expect(res2.status).toEqual("rejected");
  await initialLock
  zookeeperClient.close();
});
test("one out of two lock should throw error due to max lock limit", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  // const initialLock = main(client, {}, "/test");
  const [res1, res2] = await Promise.allSettled([
    new Promise((res, rej) => setTimeout(() => {
      main(client, {maxChildLockLimit: 1}, "/test").then(() => res(true)).catch((err) => rej(err))
    }, 500)),
    new Promise((res, rej) => setTimeout(() => {
      main(client, {maxChildLockLimit: 1}, "/test").then(() => res(true)).catch((err) => rej(err))
    }, 500))
  ]);    
  expect(res1.status).toEqual("fulfilled");
  expect(res2.status).toEqual("rejected");
  // await initialLock
  zookeeperClient.close();
});
