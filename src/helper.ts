import { PackageDetails } from "./type";

export const getPackageDetails = (): PackageDetails => {
    const packageJson = require('../package.json');
    return {
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
    };
};