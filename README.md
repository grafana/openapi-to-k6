# openapi-to-k6

## Overview

The _openapi-to-k6_ repository is a tool designed to ease the process of writing k6 scripts.
It generates a TypeScript client from OpenAPI specification which can be imported in your k6 script to
easily call your endpoints and have auto completion in your IDE.

This allows developers to easily create performance tests for their APIs based on their existing
OpenAPI documentation.

Along with the client, it also generates a sample k6 script as an example of how to use the client.

To get started, install the tool with npm via `npm install openapi-to-k6` and run it to convert your
OpenAPI specification to a TypeScript client for k6.

To take a look at a few examples of how the generated client and sample script looks, check out the [examples](./examples) directory.

Note: Optional usage analytics are gathered to make the tool better. To disable this, use the option
`--disable-analytics` or set an environment variable `DISABLE_ANALYTICS=true`.

## Getting started

1. Clone the repository

```shell
git clone https://github.com/grafana/openapi-to-k6
```

2. Install dependencies

```shell
npm install
```

3. Run the sdk generator from source

```shell
npm run dev <path-to-openapi-schema> <output path>
```

This will generate the SDK files in the corresponding directory.

4. Import them in you k6 script and run the script using the following command

```shell
k6 run --compatibility-mode=experimental_enhanced <path-to-k6-script>.ts
```

Note: `--compatibility-mode` is needed to use a typescript file as K6 script. To know more about it, click [here](https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/).

## Running E2E tests

We have some end-to-end tests to ensure the generated SDK works as expected. To run these tests, you can use the following command:

1. Navigate to the test directory

```shell
cd tests/e2e/
```

2. Use Mockoon CLI to start the mock server which will create a mock server for the endpoints defined in the OpenAPI specification.
This will run the mock server in a docker container in background.

```shell
docker run -d -v ./schema.json:/tmp/schema.json -p 3000:3000 mockoon/cli:latest -d /tmp/schema.json
```

3. Assuming you have already followed previous steps and have the environment set up, you can generate the SDK by using

```shell
npm run dev -- ./schema.json ./sdk.ts
```

4. Run the K6 script

```shell
k6 run --compatibility-mode=experimental_enhanced ./K6Script.ts
```

## Packaging

1. Run the command `npm run build` to package the project together for distribution.
2. Install the compiled package locally by using `npm install .` or `npm install -g .`.
3. Use the CLI `k6-sdkgen <path-to-openapi-schema> <output path>`

Special thanks for the the open-source library [Orval](https://orval.dev/) to facilitate the generation of these SDK.
