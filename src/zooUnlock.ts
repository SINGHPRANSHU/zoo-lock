import { type Client } from "node-zookeeper-client";
import { ZooLockLogger } from "./helper/zooLockLogger";

export class ZooUnlock {
  private timeOut: NodeJS.Timeout | undefined;
  private isTimedout: boolean = false;
  constructor(
    private readonly client: Client,
    private readonly path: string,
    private logger: ZooLockLogger,
  ) {}

  public async release() {
    this.logger.info("releasing lock", this.path);
    await this.removeNode();
  }

  public setTimeout(timeout: NodeJS.Timeout) {
    this.timeOut = timeout;
  }

  public async timeoutRelease() {
    this.logger.error(`releasing node ${this.path} lock due to timeout`);
    this.isTimedout = true;
    await this.removeNode();
  }

  private async removeNode() {
    return await new Promise((res, rej) => {
      this.client.remove(this.path, (err) => {
        if (err) {
          return rej(err);
        }
        clearTimeout(this.timeOut);
        return res(true);
      });
    });
  }
  public isLockedTimedOut() {
    return this.isTimedout;
  }
}
