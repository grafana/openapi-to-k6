export class NoFilesGeneratedError extends Error {
  constructor(message: string = 'No files were generated') {
    super(message)
    this.name = 'NoFilesGeneratedError'
  }
}
