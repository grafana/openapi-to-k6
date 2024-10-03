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