es-ccs-proxy - Elasticsearch CCS Proxy
================================================================================

`es-ccs-proxy` is a proxy to elasticsearch.  It forwards non-CCS traffic
to one elasticsearch cluster, and CCS traffic to another.  This lets you
"emulate" having CCS set up in an elasticsearch server.

This is all meant for development-time use, not production.  Thus, it has
many constraints:

- it only runs on http, not https - the actual servers pointed to can be
http or https
- it only uses API keys to access the server
- it only accepts connections from localhost


install
================================================================================

    npm install -g pmuellr/es-ccs-proxy

or run via

    npx pmuellr/es-ccs-proxy
    
usage
================================================================================

    es-ccs-proxy [options] 
    
options:

| short | long                 | description
| ----- |--------------------- | ---------------------------------------------
| `-h`  | `--help`             | display help
| `-d`  | `--debug`            | generate verbose output when running
| `-v`  | `--version`          | print version
| `-p`  | `--port <num>`       | use this port number instead of default 19200
| `-c`  | `--config <file>`    | use this config file instead of `~/.es-ccs-proxy.toml`

    es-ccs-proxy: handling servers:


config file
================================================================================

The config file is a TOML file describing the operation of es-ccs-proxy.

It must be in mode '600' (user: read/write, group/world: no access).
To make your config file mode '600', use the command:

    chmod 600 my-config-file-name.toml

The following properties can be used:

- `port`               - the port to run on, overrideable on the command line
- `server`             - URL to the non-CCS server
- `server-api-key`     - API key of the non-CCS server
- `ccs-server`         - URL to the CCS server
- `ccs-server-api-key` - API key of the CCS server


The `server` property is an array of objects.  The default server objects
configured are specified as:

    port = 9200

    [server]
    url     = "http://localhost:19200"
    api_key = "1234..."

    [ccs_server]
    url     = "http://example.com:9200"
    api_key = "5678..."


change log
================================================================================

#### 1.0.0 - under development

- under development, not yet working

license
================================================================================

This package is licensed under the MIT license.  See the [LICENSE.md][] file
for more information.

contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md][] file for more information.


[LICENSE.md]: LICENSE.md
[CONTRIBUTING.md]: CONTRIBUTING.md
[CHANGELOG.md]: CHANGELOG.md