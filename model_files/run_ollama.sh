#!/bin/bash

echo "Starting Ollama server..."
ollama serve &

echo "Waiting for Ollama server to be active..."
while [ "$(ollama list | grep 'NAME')" == "" ]; do
  sleep 1
done

echo "Ollama is ready, starting the model..."

ollama pull ksamirk/mistral-ins-lora

ollama run ksamirk/mistral-ins-lora

while true; do
  sleep 1
done