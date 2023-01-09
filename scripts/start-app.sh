#!/bin/sh

npm run start:web &
npm run build:app
env-cmd -f ./.env.development electron .
