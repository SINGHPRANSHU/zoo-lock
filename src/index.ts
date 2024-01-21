import * as zookeeper from "node-zookeeper-client";
import type { Option } from "node-zookeeper-client";
import { addZooLockLogger } from "./helper/addZooLockLogger";
import { zoolockDir } from "./zooLockDir";
import { IZooLockLogger } from "./helper/zooLockLogger";

export default async function createClient(
  connectionString: string,
  options?: Partial<Option> & {
    logger?: IZooLockLogger;
  },
): Promise<zoolockDir> {
  const logger = addZooLockLogger(console);
  const client = zookeeper.createClient(connectionString, options);
  client.connect();
  return await new Promise((res) => {
    client.once("connected", () => {
      logger.info("connected");
      return res(new zoolockDir(client, logger));
    });
  });
}
