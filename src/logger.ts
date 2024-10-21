import chalk from 'chalk'

enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
  private static instance: Logger
  private isVerbose: boolean = false

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  public setVerbose(verbose: boolean): void {
    this.isVerbose = verbose
  }

  public getVerbose(): boolean {
    return this.isVerbose
  }

  private logWithColor(
    message: string,
    level: LogLevel,
    color: chalk.Chalk
  ): void {
    const timestamp = new Date().toISOString()
    console.log(
      `${color(`[${level}]`)} ${chalk.gray(`[${timestamp}]`)} ${message}`
    )
  }

  public info(message: string): void {
    this.logWithColor(message, LogLevel.INFO, chalk.blue)
  }

  public logMessage(message: string, color?: chalk.Chalk): void {
    if (color) {
      console.log(color(message))
      return
    } else {
      console.log(message)
    }
  }

  public warning(message: string): void {
    this.logWithColor(message, LogLevel.WARNING, chalk.yellow)
  }

  public error(message: string): void {
    this.logWithColor(message, LogLevel.ERROR, chalk.red)
  }

  public debug(message: string): void {
    if (this.isVerbose) {
      this.logWithColor(message, LogLevel.DEBUG, chalk.green)
    }
  }
}

export const logger = Logger.getInstance()
