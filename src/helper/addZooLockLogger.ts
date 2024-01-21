import { IZooLockLogger, ZooLockLogger } from "./zooLockLogger";

export function addZooLockLogger(logger: IZooLockLogger) {
  let zooLockLogger = new ZooLockLogger({
    error() {},
    info() {},
  });
  if (logger) {
    zooLockLogger = new ZooLockLogger(logger);
  }
  return zooLockLogger;
}
