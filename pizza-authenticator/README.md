# Pizza Authenticator
> For more information see: [Showcase Experiments: Pizza Authenticator](https://showcase.withgoogle.com/experiment-detail/pizza-authenticator)

## Development
For local development first build the backend with `yarn build-server`. This has to be executed
every time the backend code changes. In parallel run `yarn dev` as well as
`dev_appserver.py dist/app.yaml`. The former will rebuild the front-end with every change. The
later runs a local web server executing the go backend.
All changes to the backend have been updated with `yarn build-server`. However neither server needs
to be restarted.

Point your browser to [localhost:8080/experiment/pizza-authenticator](localhost:8080/experiment/pizza-authenticator)
