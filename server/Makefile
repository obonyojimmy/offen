# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

test:
	@go test ./... -cover -race

up:
	@go run cmd/server/*.go

install:
	@go mod download

setup:
	@go run cmd/offen/*.go setup -force -source bootstrap.yml
	@echo ""
	@echo "You can now log into the development backend using the following credentials:"
	@echo ""
	@echo "Email: develop@offen.dev"
	@echo "Password: development"
	@echo ""

migrate:
	@go run cmd/offen/*.go migrate

secret:
	@go run cmd/offen/*.go secret

extract-strings:
	@./extract-strings.sh

.PHONY: bootstrap migrate secret
