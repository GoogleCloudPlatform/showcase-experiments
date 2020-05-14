BASEDIR = $(shell pwd)
PROJECT=gweb-showcase

env:
	gcloud config set project $(PROJECT)