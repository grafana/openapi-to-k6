# openapi-to-k6

## Overview

The *openapi-to-k6* repository is a tool designed to ease the process of writing K6 scripts.
It generates a typescript SDK from OpenAPI specification which can be imported in your K6 script to
easily call your endpoints and have auto completion in your IDE.

This allows developers to easily create performance tests for their APIs based on their existing
OpenAPI documentation.

Note: Optional usage analytics are gathered to make the tool better. To disable this, use the option
`--disable-analytics`.

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


## Packaging
1. Run the command `npm run build` to package the project together for distribution.
2. Install the compiled package locally by using `npm install .` or `npm install -g .`.
3. Use the CLI `k6-sdkgen <path-to-openapi-schema> <output path>`

Special thanks for the the open-source library [Orval](https://orval.dev/) to facilitate the generation of these SDK.