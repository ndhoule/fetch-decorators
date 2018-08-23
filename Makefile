#
# Binaries
#

NODE_BIN := node_modules/.bin

JEST := $(NODE_BIN)/jest
LEASOT := $(NODE_BIN)/leasot
PRETTIER := $(NODE_BIN)/prettier
TSC := $(NODE_BIN)/tsc
TSLINT := $(NODE_BIN)/tslint
WEBPACK := $(NODE_BIN)/webpack
WEBPACK-SERVE := $(NODE_BIN)/webpack-serve

#
# Files
#

SRC_EXTENSIONS ?= ts tsx

BUILD_DIR := build
REPORTS_DIR := reports
# TODO(ndhoule): Move all buildable source files into src/
# SRC_DIR := src

# All source files, including test files.
SRC := $(shell find . \
		   -path ./node_modules -prune \
		-o -path ./$(BUILD_DIR) -prune \
		-o -path ./$(REPORTS_DIR) -prune \
		$(foreach ext,$(SRC_EXTENSIONS),-o -type f -name "*.$(ext)" -print))

# All test files.
TESTS := $(foreach ext,$(SRC_EXTENSIONS),$(filter %.test.$(ext),$(SRC)))

#
# Environment
#

export NODE_ENV ?= development

#
# Configuration
#

JEST_FLAGS ?=

LEASOT_FLAGS ?= --exit-nicely

NPM_INSTALL_COMMAND ?= npm install

PRETTIER_IGNORE_FILE ?= .tslintignore

TSLINT_FORMATTER ?= codeFrame
TSLINT_FLAGS ?= --format $(TSLINT_FORMATTER)

#
# Targets
#

# Install dependencies.
node_modules: package.json package-lock.json
	$(NPM_INSTALL_COMMAND)
	@touch "$@"

# Remove all build artifacts.
clean:
	rm -rf $(BUILD_DIR) $(REPORTS_DIR)
.PHONY: clean

# Remove all build artifacts and dependencies.
distclean: clean
	rm -rf node_modules
.PHONY: distclean

# Non-destructively lint the project.
lint: node_modules
	$(TSLINT) $(TSLINT_FLAGS) $(SRC)
.PHONY: lint

# Destructively lint the project by fixing formatting and lint issues and outputting any remaining
# unfixable issues.
fmt: TSLINT_FLAGS += --fix
fmt: node_modules lint
	$(PRETTIER) --write --ignore-path=$(PRETTIER_IGNORE_FILE) $(SRC)
.PHONY: fmt

# Run the typechecker on the project (without producing artifacts).
typecheck: node_modules
	$(TSC)
.PHONY: typecheck

# Output a list of todos.
todos: node_modules
	$(LEASOT) $(LEASOT_FLAGS) $(SRC)
.PHONY: todos

# TODO(ndhoule): Run a single unit tests

# Run all unit tests.
test-unit: export NODE_ENV = test
test-unit: node_modules
	$(JEST) $(JEST_FLAGS)
.PHONY: test-unit

# Run unit tests in watch mode.
test-unit-watch: JEST_FLAGS += --watch
test-unit-watch: test-unit

# Run all tests.
test: todos lint typecheck test-unit
.PHONY: test

# TODO(ndhoule): Run all tests in watch mode?

# Build DLLs artifacts.
$(BUILD_DIR)/dlls/main.dll.js $(BUILD_DIR)/dlls/main.dll.json: node_modules
	$(WEBPACK) --config webpack.dll.config.js

# Build application artifacts.
$(BUILD_DIR)/main.js $(BUILD_DIR)/main.css $(BUILD_DIR)/index.html: node_modules $(BUILD_DIR)/dlls/main.dll.js
	$(WEBPACK) --config webpack.config.js

# Build application. Alias.
build: $(BUILD_DIR)/main.js $(BUILD_DIR)/dlls/main.dll.js

# Build the application in watch mode and start a webserver.
start: node_modules $(BUILD_DIR)/dlls/main.dll.js
	$(WEBPACK-SERVE) --config webpack.config.js
.PHONY: start

# Output a list of targets.
help:
	@echo "Targets:\n"
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | xargs -n1 echo "  "
.PHONY: help
.DEFAULT_GOAL := help
