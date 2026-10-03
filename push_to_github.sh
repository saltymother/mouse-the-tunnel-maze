#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🚀 Pushing Mouse: The Tunnel Maze to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Push successful!"
  echo "🌐 Your repository is live at: https://github.com/saltymother/mouse-the-tunnel-maze"
  echo "📄 GitHub Pages will be live at: https://saltymother.github.io/mouse-the-tunnel-maze/"
else
  echo ""
  echo "❌ Push failed. Please verify that:"
  echo "  1. You clicked 'Create repository' at https://github.com/new with name 'mouse-the-tunnel-maze'"
fi
