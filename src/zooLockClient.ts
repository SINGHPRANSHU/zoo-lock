import { type Client } from "node-zookeeper-client";
import { ZooLock, ZooLockOption } from "./zooLock";
import { ZooLockLogger } from "./helper/zooLockLogger";

export class ZooLockClient {
  constructor(
    private readonly client: Client,
    private dir: string,
    private logger: ZooLockLogger,
  ) {}

  async getZooLock(path: string, options: ZooLockOption = {}) {
    if (!path.startsWith("/")) {
      throw new Error("path should start with /");
    }
    return await new ZooLock(this.client, this.dir, this.logger, options).lock(
      path,
    );
  }
}
