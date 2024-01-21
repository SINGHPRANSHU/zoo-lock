export interface IZooLockLogger {
  info: (...message: unknown[]) => void;
  error: (...message: unknown[]) => void;
}

export class ZooLockLogger {
  constructor(private logger: IZooLockLogger) {}
  info(...messages: unknown[]) {
    this.logger.info(...messages);
  }
  error(...messages: unknown[]) {
    this.logger.error(...messages);
  }
}
