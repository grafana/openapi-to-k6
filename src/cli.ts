#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import generateK6SDK from './generator';
import { getPackageDetails, isTsNode } from './helper';
import { logger } from './logger';

const program = new Command();
const packageDetails = getPackageDetails();

async function generateSDK(openApiPath: string, outputDir: string) {
    logger.logMessage('Generating SDK for K6...');
    logger.logMessage(`OpenAPI path: ${openApiPath}`);
    logger.logMessage(`Output directory: ${outputDir}`);

    await generateK6SDK(openApiPath, outputDir);
}

program
    .name(packageDetails.commandName)
    .description(packageDetails.description)
    .version(packageDetails.version)
    .argument('<openApiPath>', 'Path to the OpenAPI spec file')
    .argument('<outputDir>', 'Directory where the SDK should be generated')
    .option('-v, --verbose', 'enable verbose mode to show debug logs')
    .action(async (openApiPath, outputDir, options: { verbose?: string }) => {
        if (options.verbose || isTsNode()) {
            logger.setVerbose(true);
            logger.debug('Verbose mode enabled, showing debug logs');
        }
        const resolvedOpenApiPath = path.resolve(openApiPath);
        const resolvedOutputDir = path.resolve(outputDir);
        logger.debug(`
            Supplied OpenAPI path: ${openApiPath}
            Resolved OpenAPI path: ${resolvedOpenApiPath}
            Supplied output directory: ${outputDir}
            Resolved output directory: ${resolvedOutputDir}
            `);
        try {
            await generateSDK(resolvedOpenApiPath, resolvedOutputDir);
        } catch (error) {
            logger.error('Failed to generate SDK:');
            console.error(error);
        }
    });

program.parse();