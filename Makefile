.PHONY: help new-module

help:
	@echo "Pantheon Platform Development Commands:"
	@echo "  make new-module NAME=xxx  Generate a new business module (backend & frontend)"

new-module:
	@if [ -z "$(NAME)" ]; then echo "Error: NAME is required. Usage: make new-module NAME=order"; exit 1; fi
	go run scripts/scaffold/scaffold.go -name $(NAME)
