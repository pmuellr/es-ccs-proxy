es-ccs-proxy - Elasticsearch CCS Proxy
================================================================================

`es-ccs-proxy` is a proxy to elasticsearch.  It forwards non-CCS traffic
to one elasticsearch cluster, and CCS traffic to another.  This lets you
"emulate" having CCS set up in an elasticsearch server.  It's not perfect,
but aims to be good enough to use CCS for Discover and Alerting, while 
maintaining the searches, data views, dashboards, rules, etc in the
local ES.

```mermaid
flowchart LR
    R[elasticsearch request] --> A
    A[es-ccs-proxy] --> B[local elasticsearch]
    B --> A
    A --> C[remote elasticsearch with CCS]
    C --> A
```

This is all meant for development-time use, not production.  Thus, it has
many constraints:

- it only runs on http, not https - the actual servers pointed to can be
http or https
- it only uses API keys to access the CCS server
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
| `-p`  | `--port <num>`       | use this port number instead of default 9200
| `-c`  | `--config <file>`    | use this config file instead of `~/.es-ccs-proxy.toml`

Run ES locally on a different port, for instance:

    yarn es snapshot --license trial -E http.port=19200

Run `es-ccs-proxy` with the port for the local `server` as 19200.  The
`es-ccs-proxy` itself runs on port 9200 by default.

Run Kibana as usual.

To access a CCS resource, change the colons (`:`) in the index pattern
to `-colon-`, and prefix the index pattern with `remote--`.  This is
the key to having an index recognized by the proxy as being a CCS 
resource, while also keeping the local Kibana from realizing it's a 
CCS resource.

For example, the CCS index pattern:

    global-stuff-*:logs-es-ccs-proxy*

should be referred to as:

    remote--global-stuff-*-colon-logs-es-ccs-proxy*


config file
================================================================================

The config file is a TOML file describing the operation of es-ccs-proxy.

It must be in mode '600' (user: read/write, group/world: no access).
To make your config file mode '600', use the command:

    chmod 600 my-config-file-name.toml

The following properties can be used:

- `port`               - the port to run on, overrideable on the command line, default 9200
- `server.url`         - URL to the local ES server, with user/pass included
- `ccs-server.url`     - URL to the CCS ES server
- `ccs-server.api_key` - API key of the CCS ES server

Here's an example `toml` file:

    [server]
    url = "http://elastic:changeme@localhost:19200"

    [ccs_server]
    url     = "https://example.com"
    api_key = "...=="


change log
================================================================================

#### 1.0.0 - under development

- under development, not yet working
- holy crap, it's now working with Discover; next steps, set up the kibana serverless o11y tf stuff to use this


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