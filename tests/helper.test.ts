import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { formatAllFilesInDirectory, getPackageDetails } from '../src/helper';
import { PackageDetails } from '../src/type';


jest.mock('fs');
jest.mock('path');
jest.mock('prettier');

// Mock the package.json file
jest.mock('../package.json', () => ({
    name: 'test-package-name',
    description: 'This is a test package',
    bin: { 'test-package': 'bin/test-package.js' },
    version: '1.0.0',
}), { virtual: true });

describe('getPackageDetails', () => {
    it('should return the package details', () => {
        const expectedDetails: PackageDetails = {
            name: 'test-package-name',
            commandName: 'test-package',
            description: 'This is a test package',
            version: '1.0.0',
        };

        const details = getPackageDetails();
        expect(details).toEqual(expectedDetails);
    });
});

describe('formatAllFilesInDirectory', () => {
    const mockFiles = ['file1.ts', 'file2.js'];
    const mockDirectory = '/mock-directory';
    const mockFileContent = 'const x = 1;';
    const mockFormattedContent = 'const x = 1; // formatted';

    beforeEach(() => {
        (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
        (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);
        (fs.writeFileSync as jest.Mock).mockImplementation(() => { });
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (prettier.format as jest.Mock).mockReturnValue(mockFormattedContent);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should format all files in the directory', async () => {
        await formatAllFilesInDirectory(mockDirectory);

        expect(prettier.format).toHaveBeenCalledTimes(mockFiles.length);
        mockFiles.forEach((file, index) => {
            const filePath = `${mockDirectory}/${file}`;
            expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
            expect(prettier.format).toHaveBeenCalledWith(mockFileContent, { filepath: filePath });
            expect(fs.writeFileSync).toHaveBeenNthCalledWith(index + 1, filePath, mockFormattedContent);
        });
    });

    it('should handle empty directory', () => {
        (fs.readdirSync as jest.Mock).mockReturnValue([]);
        formatAllFilesInDirectory(mockDirectory);
        expect(fs.readFileSync).not.toHaveBeenCalled();
        expect(prettier.format).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should use prettier config if available', async () => {
        const mockPrettierConfig = { semi: false };
        (prettier.resolveConfig as jest.Mock).mockResolvedValue(mockPrettierConfig);

        await formatAllFilesInDirectory(mockDirectory);

        mockFiles.forEach((file, index) => {
            const filePath = `${mockDirectory}/${file}`;
            expect(prettier.format).toHaveBeenNthCalledWith(index + 1, mockFileContent, { ...mockPrettierConfig, filepath: filePath });
        });
    });
});