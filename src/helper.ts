import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { PackageDetails } from "./type";

export const getPackageDetails = (): PackageDetails => {
    const packageJson = require('../package.json');
    const commandName = Object.keys(packageJson.bin)[0];
    return {
        name: packageJson.name,
        commandName,
        description: packageJson.description,
        version: packageJson.version,
    };
};

/**
 * Recursively formats all files in the given directory using Prettier.
 * If a prettier configuration file is present in the directory, it will be used.
 *
 * @param dir - Directory path to start formatting files.
 */
export async function formatAllFilesInDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Recursively format files in subdirectories
            await formatAllFilesInDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
            // Read file contents
            const content = fs.readFileSync(fullPath, 'utf-8');

            // Format using Prettier
            const options = await prettier.resolveConfig(fullPath);
            const formatted = await prettier.format(content, { ...options, filepath: fullPath });

            // Write formatted content back to the file
            fs.writeFileSync(fullPath, formatted);
            console.log(`Formatted: ${fullPath}`);
        }
    }
}

/**
 * A singleton Class to allow redirecting stdout and stderr to a null stream.
 * This is used to supress the output from third-party libraries.
 *
 * Note: Make sure to call restoreOutput() after the third-party library call to restore the output.
 *
 * @example
 * ```typescript
 * const outputOverrider = OutputOverrider.getInstance();
 * outputOverrider.redirectOutputToNullStream();
 * // Call the third-party library
 * outputOverrider.restoreOutput();
 * ```
 *
 * @export
 * @class OutputOverrider
 */
export class OutputOverrider {
    private static instance: OutputOverrider | null = null;
    private originalStdoutWrite: any;
    private originalStderrWrite: any;

    // Making the constructor private to prevent direct instantiation
    private constructor() {
        this.originalStdoutWrite = process.stdout.write;
        this.originalStderrWrite = process.stderr.write;
    }
    // Static method to get the single instance of the class
    public static getInstance() {
        if (OutputOverrider.instance === null) {
            OutputOverrider.instance = new OutputOverrider();
        }
        return OutputOverrider.instance;
    }

    public redirectOutputToNullStream() {
        process.stdout.write = process.stderr.write = () => true;
    }

    public restoreOutput() {
        process.stdout.write = this.originalStdoutWrite;
        process.stderr.write = this.originalStderrWrite;
    }
}

/**
 * Check if the current script is running with ts-node. i.e. directly from source.
 *
 * @export
 * @returns {boolean}
 */
export function isTsNode(): boolean {
    const scriptPath = process.argv[1];
    return scriptPath.endsWith('.ts') || scriptPath.includes('ts-node');
}