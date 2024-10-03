import { Command } from 'commander';
import path from 'path';
import generateK6SDK from './generator';
import { getPackageDetails } from './helper';

const program = new Command();
const packageDetails = getPackageDetails();

async function generateSDK(openApiPath: string, outputDir: string) {
    console.log('Generating SDK...');
    console.log('OpenAPI path:', openApiPath);
    console.log('Output directory:', outputDir);

    generateK6SDK(openApiPath, outputDir);
}

program
    .name(packageDetails.name)
    .description(packageDetails.description)
    .version(packageDetails.version)
    .argument('<openApiPath>', 'Path to the OpenAPI spec file')
    .argument('<outputDir>', 'Directory where the SDK should be generated')
    .action(async (openApiPath, outputDir) => {
        const resolvedOpenApiPath = path.resolve(openApiPath);
        const resolvedOutputDir = path.resolve(outputDir);
        try {
            await generateSDK(resolvedOpenApiPath, resolvedOutputDir);
        } catch (error) {
            console.error('Failed to generate SDK:', error);
        }
    });

program.parse();