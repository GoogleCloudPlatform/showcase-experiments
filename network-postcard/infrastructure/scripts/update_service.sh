if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Updating service on $name && \
    gcloud compute --project $PROJECT scp  ../gcprelay $name:~ --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo /etc/init.d/gcprelay stop || true" --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay /opt" --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo /etc/init.d/gcprelay start" --zone $name && \
    echo Updating service on $name - finished) &
done 

wait
echo All servers updated