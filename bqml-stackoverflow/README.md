# BQML StackOverflow
> For more information see: [Showcase Experiments: BQML Analyzer](https://showcase.withgoogle.com/experiment-detail/bqml-stackoverflow)

## Development

### Database
Make sure you `server/db_user.yaml.sample` to `server/db_user.yaml` with the correct credentials.
For the local webserver to be able to connect to your Google Cloud SQL database make check out
[these instructions](https://cloud.google.com/sql/docs/mysql/quickstart-proxy-test) using the `cloud_sql_proxy`.

For help with the creation of the database check out [this article](https://towardsdatascience.com/when-will-stack-overflow-reply-how-to-predict-with-bigquery-553c24b546a3) by [Felipe Hoffa](https://twitter.com/felipehoffa).


### Webserver
For local development make sure you run `yarn dev` and `dev_appserver.py dist/app.yaml` in
parallel.

* **Parcel:** [Parcel](https://github.com/parcel-bundler/parcel) is used to build and bundle all files. This is executed through `yarn dev` and
continues to watch your files as they change.

* **dev_apperserver.py**: This is a local webserver serving your files. Make sure the [Google Cloud SDK](https://cloud.google.com/sdk/)
is installed.

Point your browser to [localhost:8080/experiment/bqml-stackoverflow](http://localhost:8080/experiment/bqml-stackoverflow).
