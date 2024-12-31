#!/bin/bash

echo "Starting Ollama server..."
ollama serve &

echo "Waiting for Ollama server to be active..."
while [ "$(ollama list | grep 'NAME')" == "" ]; do
  sleep 1
done

echo "Ollama is ready, starting the model..."

ollama pull ksamirk/customer-support-quantized

ollama run ksamirk/customer-support-quantized

while true; do
  sleep 1
done