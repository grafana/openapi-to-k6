import { InfoObject } from 'openapi3-ts/oas30';
import orval from 'orval';
import { formatAllFilesInDirectory, getPackageDetails } from './helper';
import { k6ClientBuilder } from './k6SdkClient';


const generatedFileHeaderGenerator = (info: InfoObject) => {
    const packageDetails = getPackageDetails();

    return [
        `Automatically generated by ${packageDetails.name}: ${packageDetails.version}`,
        `Do not edit manually.`,
        ...(info.title ? [info.title] : []),
        ...(info.description ? [info.description] : []),
        ...(info.version ? [`OpenAPI spec version: ${info.version}`] : []),
    ]
};


export default async (openApiPath: string, outputDir: string) => {
    /**
     * Note!
     * 1. override.requestOptions is not supported for the custom K6 client
     * 2. override.mutator is not supported for the custom K6 client
    */
    orval({
        input: openApiPath,
        output: {
            target: outputDir,
            mode: 'split',
            client: () => k6ClientBuilder,
            override: {
                header: generatedFileHeaderGenerator,
            }
        }
    });

    await formatAllFilesInDirectory(outputDir);
};

