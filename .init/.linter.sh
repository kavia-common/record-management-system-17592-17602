#!/bin/bash
cd /home/kavia/workspace/code-generation/record-management-system-17592-17602/frontend_react
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

