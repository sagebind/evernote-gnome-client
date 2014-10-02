#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# build schemas
glib-compile-schemas "$DIR/src/schemas"
