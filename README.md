<div align="center">

  <img
    src="https://raw.githubusercontent.com/grafana/openapi-to-k6/main/images/openapi-to-k6.png"
    width="600"
    style="pointer-events: none;" />
  <br />
</div>

## Overview

The _openapi-to-k6_ repository is a tool designed to simplify the process of writing k6 scripts.
It generates a TypeScript client from an OpenAPI specification that you can import in your k6 script to
easily call your endpoints and have auto-completion in your IDE.

This lets developers easily create performance tests for their APIs based on their existing
OpenAPI documentation.

Along with the client, it also generates a sample k6 script as an example of how to use the client.

The generated client exports a class with methods for each endpoint in the OpenAPI specification. You can create
an instance of the class and use the methods to call the endpoints.

To see examples of the generated client and sample script, check out the [examples](./examples) directory.

## Getting started

1. Install the tool globally via:

    ```shell
    npm install -g @grafana/openapi-to-k6
    ```

2. To start using the tool, either give the path to your OpenAPI schema file or provide a URL to your OpenAPI schema and the output path where you want to generate the client files:

    ```shell
    openapi-to-k6 <path-to-openapi-schema | url-to-openapi-schema> <output path>
    ```

    This will generate a TypeScript client and a sample k6 script in the corresponding directory.

    You can also supply the optional flag `--include-sample-script` to also generate a sample k6 script
    along with the client.

💡 _Note_: The tool supports both JSON and YAML format for OpenAPI schemas.

### Options

The following are some of the configuration options supported by the tool:

1. `--mode` or `-m`: Specify the mode to use for generating the client. The following options are available:
   1. `single`: This is the default mode used if nothing is specified. It generates the TypeScript client as a single file with all the types and implementation in a single file.
   2. `split`: This mode splits the types and implementation into separate files.
   3. `tags`: This modes splits your OpenAPI schema based on the tags and generates a separate client for each tag. If a route has no tag set, it will be available in the `default.ts` file.

   To check how the output looks for each mode, check out the [examples](./examples) directory.

2. `--only-tags`: Filter the generated client to only include routes with specific tags from your OpenAPI schema. Multiple tags can be specified to include routes matching any of those tags. Routes without tags will be excluded. This is useful for generating focused clients that only contain the endpoints you need.

   For example: `openapi-to-k6 <path-to-openapi-schema> <output path> --only-tags ItemsHeader` will generate a client with only the routes that have the `ItemsHeader` tag. You can specify multiple tags by using multiple `--only-tags` flags or by separating them with spaces: `--only-tags tag1 --only-tags tag2`.

3. `--disable-analytics`: Disable anonymous usage analytics reporting. You can also set an environment variable `DISABLE_ANALYTICS=true` to disable analytics.
4. `--include-sample-script`: Generate a sample k6 script. The generated sample script uses the examples defined in the OpenAPI schema requests to make the script usable out of the box. If the examples are not defined, it will use Faker to generate random data.
5. `--verbose` or `-v` : Enable verbose logging to see more detailed logging output.
6. `--help` or `-h` : Show help message.

## Developing locally

1. Clone the repository:

```shell
git clone https://github.com/grafana/openapi-to-k6
```

2. Install dependencies:

```shell
npm install
```

3. Run the SDK generator from source:

```shell
npm run dev <path-to-openapi-schema> <output path>
```

This will generate the SDK files in the corresponding directory.

4. Import them in your k6 script and run the script using the following command:

```shell
k6 run <path-to-k6-script>.ts
```

## Running E2E tests

We have some end-to-end tests to ensure the generated SDK works as expected. To run these tests:

1. Navigate to the test directory:

```shell
cd tests/e2e/
```

2. Use Mockoon CLI to start the mock server which will create a mock server for the endpoints defined in the OpenAPI specification.
This will run the mock server in a Docker container in background:

```shell
docker run -v ./schema.json:/tmp/schema.json -p 3000:3000 mockoon/cli:latest -d /tmp/schema.json
```

3. Assuming you have already followed previous steps and have the environment set up, you can generate the SDK by using:

```shell
npm run dev -- ./schema.json ./sdk.ts
```

4. Run the k6 script:

```shell
k6 run ./K6Script.ts
```

## Packaging

1. Run the command `npm run build` to package the project for distribution.
2. Install the compiled package locally by using `npm install .` or `npm install -g .`.
3. Use the CLI: `k6-sdkgen <path-to-openapi-schema> <output path>`.

## Releasing

To release a new version of the tool, create a new release on GitHub with the new version number as a tag (for example, `0.1.0`) and the release notes. After the release is created, GitHub Actions will automatically package the tool and publish it to npm.

Special mention to the the open-source library [Orval](https://orval.dev/) which is used for the generation of the TypeScript client.
