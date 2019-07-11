if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties
projectnumber=$(gcloud projects describe $PROJECT --format='value[terminator=""](projectNumber)')

for name in $list; do
    (echo Creating machine: $name && \
    gcloud beta compute --project $PROJECT instances create $name --zone $name --machine-type $MACHINESIZE \
    --subnet "default" --maintenance-policy "MIGRATE" \
    --service-account "$projectnumber-compute@developer.gserviceaccount.com" \
    --min-cpu-platform "Automatic" --tags "http-server","gcprelay-server" \
    --scopes "https://www.googleapis.com/auth/datastore,https://www.googleapis.com/auth/pubsub,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/trace.append,https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/cloud.useraccounts.readonly" \
    --image "debian-9-stretch-v20171025" --image-project "debian-cloud" \
    --verbosity error --boot-disk-size "10" --boot-disk-type "pd-standard" \
    --boot-disk-device-name $name && \
    gcloud compute --project $PROJECT scp  ../gcprelay $name:~ --zone $name && \
	gcloud compute --project $PROJECT scp  ../gcprelay.sh $name:~ --zone $name && \
	gcloud compute --project $PROJECT scp  ../../assets/img $name:~ --zone $name --recurse  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mkdir /var/log/gcprelay" --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mkdir /usr/local/gcprelay" --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay /opt" --zone $name  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay.sh gcprelay" --zone $name  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay /etc/init.d" --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mv img/* /usr/local/gcprelay" --zone $name  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo chown root:root /etc/init.d/gcprelay" --zone $name  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo chmod 755 /etc/init.d/gcprelay" --zone $name  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo update-rc.d gcprelay defaults" --zone $name  && \
	gcloud compute --project $PROJECT ssh $name --command="sudo /etc/init.d/gcprelay start" --zone $name
    echo Creating machine: $name - finished) &
done 

wait
echo All servers created