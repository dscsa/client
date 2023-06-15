# `v2 Client`

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).

For more information, go to https://aurelia.io/docs/cli/webpack

## Local Development
cp .env.example .env
By default will connect to API running locally on port 8081
To override, cp src/config/environment.development.json.example to src/config/environment.development.json and modify apiUrl 
npm watch
docker compose up will run client only
docker compose --profile fullstack up will run w/ server (assumes server is in ../server)

## Running w/ local server

## Production Deployment
npm build
Serve files from dist folder
