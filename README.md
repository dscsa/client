# `v2 Client`

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).

For more information, go to https://aurelia.io/docs/cli/webpack

## Local Development Quickstart
```shell
# Run these locally (not in a container)
cp .env.example .env
npm install
npm build:dev
# Alternatively, you can run `npm watch` to allow automatic rebuilds on file changes
docker compose up
```
The client will now be available at http://0.0.0.0:8082 (the port can be customized via the .env file).

**NOTE: The first login will be very slow due to the UI loading all drugs into browser local storage.  Subsequent logins will be much faster**

By default the UI will connect to API running locally on port 8081 (see https://github.com/dscsa/server for more info).
To override the server host/port:
- `cp src/config/environment.development.json.example src/config/environment.development.json`
- modify `apiUrl` in environment.development.json
- Rebuild

### Running w/ local server
See documentation in https://github.com/dscsa/server

## Production Deployment
TODO: This

