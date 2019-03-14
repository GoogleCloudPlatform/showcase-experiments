# Pi Day
> For more information see: [Showcase Experiments: Pi Day](https://showcase.withgoogle.com/experiment-detail/pi)

## Development
For local development make sure you run `yarn dev` and `dev_appserver.py dist/app.yaml` in
parallel.

* **Parcel:** [Parcel](https://github.com/parcel-bundler/parcel) is used to build and bundle all files. This is executed through `yarn dev` and continues to watch your files as they change.

* **dev_apperserver.py**: This is a local webserver serving your files. Make sure the [Google Cloud SDK](https://cloud.google.com/sdk/)
is installed. Every change in backend code (`main.go`) has to be pushed to the webserver by calling `yarn build-server`

Point your browser to [localhost:8080/experiment/pi](http://localhost:8080/experiment/pi).
