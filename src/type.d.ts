
export interface PackageDetails {
    name: string;
    commandName: string;
    description: string;
    version: string;
}

export interface SchemaDetails {
    title: string
}

export interface AnalyticsData {
    generatedRequestsCount: {
        post: number,
        put: number,
        get: number,
        delete: number,
        patch: number,
        head: number,
    },
    openApiSpecVersion: string,
    toolVersion: string
    anonymousUserId: string
    osPlatform?: string
    osArch?: string
    osType?: string
}