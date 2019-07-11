if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Updating images on $name && \
	gcloud compute --project $PROJECT scp  ../../assets/img $name:~ --zone $name --recurse && \
	gcloud compute --project $PROJECT ssh $name --command="sudo rm /usr/local/gcprelay/* " --zone $name && \
	gcloud compute --project $PROJECT ssh $name --command="sudo mv img/* /usr/local/gcprelay" --zone $name &&\
    echo Updating images on $name - finished) &
done 

wait
echo All servers updated