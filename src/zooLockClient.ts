import { type Client } from "node-zookeeper-client";
import { ZooLock } from "./zooLock";
import { ZooLockLogger } from "./helper/zooLockLogger";

export class ZooLockClient {
  constructor(
    private readonly client: Client,
    private dir: string,
    private logger: ZooLockLogger,
  ) {}

  public getClient(): Client {
    return this.client;
  }

  async getZooLock(path: string) {
    return await new ZooLock(this.client, this.dir, this.logger).lock(path);
  }
}
