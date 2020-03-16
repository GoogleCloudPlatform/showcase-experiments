FROM gcr.io/cloud-builders/gcloud:latest
RUN rm -rf /var/lib/apt/lists/*
RUN apt-get update -yq && apt-get upgrade -yq && \
    apt-get install -yq curl git nano

RUN curl -sL https://deb.nodesource.com/setup_13.x | bash - && \
    apt-get install -yq build-essential nodejs node-gyp 
RUN npm install -g npm
RUN npm install -g --save-dev @angular/cli  
RUN npm install -g --save-dev yarn 
RUN npm install --save-dev  --unsafe-perm node-sass
RUN npm install --save-dev @angular-devkit/build-angular
RUN npm install -g --save-dev parcel-bundler

ENTRYPOINT ["make"]