import { CreateMode, type Client } from "node-zookeeper-client";
import { ZooUnlock } from "./zooUnlock";
import { ZooLockLogger } from "./helper/zooLockLogger";

export class ZooLock {
  key: string | undefined;
  path: string | undefined;
  constructor(
    private readonly client: Client,
    private dir: string,
    private logger: ZooLockLogger,
  ) {}

  public async lock(path: string): Promise<ZooUnlock> {
    await this.createDir();
    const lockedPath = await this.createChild(this.dir + path);
    this.path = path;
    this.key = lockedPath.replace(`${path}/`, "");
    await this.checkForLock(path, lockedPath);
    return new ZooUnlock(this.client, lockedPath, this.logger);
  }

  async getChildren(path: string): Promise<string[]> {
    return await new Promise((res, rej) => {
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
    children: string[],
    currIndex: number,
    lockedPath: string,
  ) {
    this.logger.info(
      "watching for",
      "/" + children[currIndex - 1],
      "by",
      lockedPath,
    );
    await new Promise((res, rej) => {
      this.client.exists(
        this.dir + "/" + children[currIndex - 1],
        async (event) => {
          this.logger.info(event);
          await this.checkForLock(path, lockedPath);
          res(true);
        },
        (err) => {
          if (err) {
            this.logger.error(
              "error while watching node",
              this.dir + "/" + children[currIndex - 1],
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
      await this.watchChild(path, children, childExist, lockedPath);
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
