<div align="center">

  <img
    src="https://raw.githubusercontent.com/grafana/openapi-to-k6/main/images/openapi-to-k6.png"
    width="600"
    style="pointer-events: none;" />
  <br />
</div>

## Overview

The _openapi-to-k6_ repository is a tool designed to ease the process of writing k6 scripts.
It generates a TypeScript client from OpenAPI specification which can be imported in your k6 script to
easily call your endpoints and have auto completion in your IDE.

This allows developers to easily create performance tests for their APIs based on their existing
OpenAPI documentation.

Along with the client, it also generates a sample k6 script as an example of how to use the client.

The generated client exports a class with methods for each endpoint in the OpenAPI specification. You can create
a instance of the class and use the methods to call the endpoints.

To take a look at a few examples of how the generated client looks and sample script looks, check out the [examples](./examples) directory.


## Getting started

1. Install the tool globally via

    ```shell
    npm install -g @grafana/openapi-to-k6
    ```

2. To start using the tool either give path to your OpenAPI schema file or provide a URL to your Open
   API schema and the output path where you want to generate the client files.

    ```shell
    openapi-to-k6 <path-to-openapi-schema | url-to-openapi-schema> <output path>
    ```

    This will the generate a TypeScript client and a sample k6 script in the corresponding directory.

    You can also supply the optional flag `--include-sample-script` to also generate a sample k6 script
    along with the client.

💡 _Note_: The tool supports both JSON and YAML format for OpenAPI schema.

### Options

Following are some of the configuration options supported by the tool.

1. `--mode` or `-m`: Specify the mode to use for generating the client. Following are available options:
   1. `single`: This is the default mode used is nothing is specified. It generated the TypeScript client as a single file with all the types and implementation in a single file.
   2. `split`: This mode splits the types and implementation into separate files.
   3. `tags`: This modes splits your OpenAPI schema based on the tags and generates a separate client for each tag. If a route has no tag set, it will be available in `default.ts` file.

   To check how the output looks for each mode, check out the [examples](./examples) directory.
2. `--enum-generation-type`: Specify how enums are generated:
   1. `const`: Generates a const object.
   2. `enum`: Generates a native enum.
   3. `union`: Generates a simple union type.
3. `--only-tags`: Filter the generated client to only include routes with specific tags from your OpenAPI schema. Multiple tags can be specified to include routes matching any of those tags. Routes without tags will be excluded. This is useful for generating focused clients that only contain the endpoints you need.
e.g. `openapi-to-k6 <path-to-openapi-schema> <output path> --only-tags ItemsHeader` will generate a client with only the routes that have the `ItemsHeader` tag. Multiple tags can be specified by using multiple `--only-tags` flags or by separating them with spaces.
1. `--disable-analytics`: Disable anonymous usage analytics reporting which helping making the tool better. You can also set an environment variable `DISABLE_ANALYTICS=true` to disable the analytics.
2. `--include-sample-script`: Generate a sample k6 script. The generated sample script uses the examples defined in the OpenAPI schema requests to make the script usable out of the box. If the examples are not defined, it will use Faker to generate random data.
3. `--verbose` or `-v` : Enable verbose logging to see more detailed logging output.
4. `--help` or `-h` : Show help message.

## Developing locally

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
docker run -v ./schema.json:/tmp/schema.json -p 3000:3000 mockoon/cli:latest -d /tmp/schema.json
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

## Releasing

To release a new version of the tool, create a new release on GitHub with the new version number as tag (e.g. `0.1.0` ) and the release notes. After the release is created, the GitHub actions will automatically package the tool and publish it to npm.

Special mention for the the open-source library [Orval](https://orval.dev/) which is used for the generation of the TypeScript client.
