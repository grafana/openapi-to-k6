import fs from 'fs'
import { promisify } from 'util'

export const writeFile = promisify(fs.writeFile)
export const readFile = promisify(fs.readFile)
export const mkdtemp = promisify(fs.mkdtemp)
export const rmdir = promisify(fs.rmdir)

export const loadFixture = (filePath: string) => {
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

export const replaceSpacesAndNewLineToSingleSpace = (input: string): string => {
  return input.replace(/\s+/g, ' ')
}
