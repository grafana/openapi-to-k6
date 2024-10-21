#!/bin/bash

# Define the base directory
BASE_DIR="examples"

# Iterate through all folders in the base directory
for dir in "$BASE_DIR"/*/; do
    # Check if the directory contains a schema.json file
    if [ -f "$dir/schema.json" ]; then
        # Change to the directory
        cd "$dir" || continue

        # Run the openapi-to-k6 command
        npm run dev -- schema.json ./

        # Change back to the base directory
        cd - || exit
    fi
done

echo "Processing complete."
