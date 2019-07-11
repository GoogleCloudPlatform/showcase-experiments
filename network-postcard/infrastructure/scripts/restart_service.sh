if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Restarting service on $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo /etc/init.d/gcprelay stop" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo /etc/init.d/gcprelay start" --zone $name && \
    echo Restarting service on $name - finished) &
done 

wait
echo All servers restarted