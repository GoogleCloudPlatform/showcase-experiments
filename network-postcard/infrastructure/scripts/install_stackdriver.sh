if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Installing Stackdriver - $name && \
    gcloud compute --project $PROJECT ssh $name --command="curl -sSO https://dl.google.com/cloudagents/install-monitoring-agent.sh" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo bash install-monitoring-agent.sh" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="curl -sSO https://dl.google.com/cloudagents/install-logging-agent.sh" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo bash install-logging-agent.sh" --zone $name && \
    gcloud compute --project $PROJECT scp gcprelay.conf $name:~ --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay.conf /etc/google-fluentd/config.d" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo service google-fluentd reload" --zone $name && \
    
    echo Installing Stackdriver - $name - finished) &
done 

wait
echo All servers have Stackdriver installed