BASEDIR = $(shell pwd)
include ../Makefile.properties
PROJECTNUMBER = $(shell gcloud projects describe gcprelay-next --format='value[terminator=""](projectNumber)')

gcprelay:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "$(BASEDIR)/gcprelay" "$(BASEDIR)/server/main.go"

local:
	go build -o "$(BASEDIR)/gcprelay" "$(BASEDIR)/server/main.go"

clean:
	-rm "$(BASEDIR)/gcprelay"

vms: create service	

create: 
	@cd $(BASEDIR)/scripts/ && ./create.sh $(name)

delete: 
	@cd $(BASEDIR)/scripts/ && ./delete.sh $(name)

update: update.images update.service

update.images: 
	@cd $(BASEDIR)/scripts/ && ./update_images.sh $(name)

restart:
	@cd $(BASEDIR)/scripts/ && ./restart_service.sh $(name)

restart.vms:
	@cd $(BASEDIR)/scripts/ && ./restart_servers.sh $(name)	

update.service: clean gcprelay
	@cd $(BASEDIR)/scripts/ && ./update_service.sh $(name)

installcerts:
	@cd $(BASEDIR)/scripts/ && ./install_cert.sh $(name)

installstackdriver:
	@cd $(BASEDIR)/scripts/ && ./install_stackdriver.sh $(name)		

