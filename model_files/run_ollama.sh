#!/bin/bash

echo "Starting Ollama server..."
ollama serve &  # Start Ollama in the background

echo "Ollama is ready, starting the model..."

ollama run ksamirk/customer-support-quantized

echo "Waiting for Ollama server to be active..."
while true; do
  sleep 1
done