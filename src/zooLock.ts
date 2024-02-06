import { CreateMode, type Client } from "node-zookeeper-client";
import { ZooUnlock } from "./zooUnlock";
import { ZooLockLogger } from "./helper/zooLockLogger";

export type ZooLockOption = {
  timeout?: number;
};

export class ZooLock {
  key: string | undefined;
  path: string | undefined;
  constructor(
    private readonly client: Client,
    private dir: string,
    private logger: ZooLockLogger,
    private options: ZooLockOption,
  ) {}

  public async lock(path: string): Promise<ZooUnlock> {
    await this.createDir();
    const lockedPath = await this.createChild(this.dir + path);
    const zoounlock = new ZooUnlock(this.client, lockedPath, this.logger);
    await this.checkLockTimeout(lockedPath, zoounlock); // this will run async and check for timeout for lock held by node
    try {
      this.path = path;
      this.key = lockedPath.replace(`${path}/`, "");
      await this.checkForLock(path, lockedPath);
    } catch (error) {
      !zoounlock.isLockedTimedOut() && (await zoounlock.release()); // if lock isalready released by timeout then no need to release it again
      if (zoounlock.isLockedTimedOut()) {
        throw new Error(`locked timedout for ${lockedPath} node`);
      } else {
        throw error;
      }
    }
    return zoounlock;
  }

  private async checkLockTimeout(lockedPath: string, zoounlock: ZooUnlock) {
    if (this.options.timeout) {
      const lockTimeout = await this.setTimeoutPromise(() =>
        zoounlock.timeoutRelease(),
      );
      zoounlock.setTimeout(lockTimeout);
    }
  }

  private setTimeoutPromise<T>(
    callback: () => Promise<T>,
  ): Promise<NodeJS.Timeout> {
    return new Promise((res) => {
      const timeout = setTimeout(() => {
        callback().catch((err) =>
          this.logger.info("something went wrong while releasing lock", err),
        );
      }, this.options.timeout);
      res(timeout);
    });
  }

  async getChildren(path: string): Promise<string[]> {
    return new Promise((res, rej) => {
      this.client.getChildren(this.dir, (err, children) => {
        if (err || children.length === 0) {
          return rej(err || "children not set");
        }

        const filteredChildren = children
          .filter((child) => child !== null && ("/" + child).startsWith(path))
          .sort((a, b) => {
            const first = a.replace(path.replace("/", ""), "");
            const second = b.replace(path.replace("/", ""), "");
            return parseInt(first) - parseInt(second);
          });
        res(filteredChildren);
      });
    });
  }

  async watchChild(
    path: string,
    prevChild: string,
    currIndex: number,
    lockedPath: string,
  ) {
    this.logger.info("watching for", "/" + prevChild, "by", lockedPath);
    await new Promise((res, rej) => {
      this.client.exists(
        this.dir + "/" + prevChild,
        (event) => {
          this.logger.info(event);
          this.checkForLock(path, lockedPath)
            .then(() => res(true))
            .catch(() => {
              rej(false);
            });
        },
        (err) => {
          if (err) {
            this.logger.error(
              "error while watching node",
              this.dir + "/" + prevChild,
              "by",
              lockedPath,
            );
            return rej(err);
          }
        },
      );
    });
  }

  async createChild(path: string): Promise<string> {
    this.logger.info("child created at dir", this.dir, path);

    return new Promise((res, rej) => {
      this.client.create(
        path,
        CreateMode.EPHEMERAL_SEQUENTIAL,
        (err, lockedPath) => {
          if (err) {
            return rej(err);
          }
          res(lockedPath);
        },
      );
    });
  }

  async checkForLock(path: string, lockedPath: string) {
    const children = await this.getChildren(path);
    const childExist = children.findIndex(
      (child) => this.dir + "/" + child === lockedPath,
    );

    if (childExist === -1) {
      throw new Error("child does not exist");
    } else if (childExist === 0) {
      this.logger.info("lock acquired by", lockedPath);
    } else {
      await this.watchChild(
        path,
        children[childExist - 1],
        childExist,
        lockedPath,
      );
    }
  }

  async createDir() {
    return new Promise((res, rej) => {
      this.client.exists(this.dir, (err, stat) => {
        if (err) {
          this.logger.error(
            `failed to create dir on path ${this.dir} due to error`,
            err,
          );
          return rej(err);
        } else if (stat) {
          return res(true);
        } else {
          this.client.mkdirp(this.dir, (err, path) => {
            if (err) {
              this.logger.error(
                `failed to create dir on path ${this.dir} due to error`,
                err,
              );
              return rej(err);
            } else {
              this.logger.error(`dir created ${path}`);
              return res(true);
            }
          });
        }
      });
    });
  }
}
