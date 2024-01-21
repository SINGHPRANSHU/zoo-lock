import { type Client } from "node-zookeeper-client";
import { ZooLockLogger } from "./helper/zooLockLogger";

export class ZooUnlock {
  constructor(
    private readonly client: Client,
    private readonly path: string,
    private logger: ZooLockLogger,
  ) {}

  public async release() {
    await new Promise((res, rej) => {
      this.logger.info("releasing lock", this.path);

      this.client.remove(this.path, (err) => {
        if (err) {
          return rej(err);
        }
        return res(true);
      });
    });
  }
}
