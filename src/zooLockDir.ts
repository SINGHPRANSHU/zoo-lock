import { Client } from "node-zookeeper-client";
import { ZooLockClient } from "./zooLockClient";
import { ZooLockLogger } from "./helper/zooLockLogger";

export class zoolockDir {
  constructor(
    private readonly client: Client,
    private logger: ZooLockLogger,
  ) {}

  setDir(dir: string): ZooLockClient {
    return new ZooLockClient(this.client, dir, this.logger);
  }
}
