import createClient from "../src";
import { zoolockDir } from "../src/zooLockDir";

const ZooKeeperUrl = "localhost:2181";

async function main(client: zoolockDir, timeout: number, dir: string) {
  const unlock = await client.setDir(dir).getZooLock("/hello", { timeout });
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

test("should throw error due to timeout", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  await expect(main(client, 1000, "/test"))
    .rejects.toEqual(false)
    .finally(() => zookeeperClient.close());
});

test("should not throw error due to timeout", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  await expect(main(client, 10000, "/test"))
    .resolves.toEqual(true)
    .finally(() => zookeeperClient.close());
});

test("one out of two lock should throw error", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  const [res1, res2] = await Promise.allSettled([
    main(client, 1000, "/test"),
    main(client, 10000, "/test"),
  ]);
  expect(res1.status).toEqual("rejected");
  expect(res2.status).toEqual("fulfilled");
  zookeeperClient.close();
});
test("two out of two lock should throw error", async () => {
  const client = await createClient(ZooKeeperUrl);
  const zookeeperClient = client.getClient();
  const [res1, res2] = await Promise.allSettled([
    main(client, 1000, "/test"),
    main(client, 1000, "/test"),
  ]);
  expect(res1.status).toEqual("rejected");
  expect(res2.status).toEqual("rejected");
  zookeeperClient.close();
});
