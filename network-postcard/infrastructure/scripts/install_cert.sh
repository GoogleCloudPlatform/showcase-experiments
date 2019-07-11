if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Installing certs on $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo openssl ecparam -genkey -name secp384r1 -out gcprelay.key" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo openssl req -new -x509 -sha256 -key gcprelay.key -out gcprelay.crt -days 3650 -subj /C=US/ST=CA/L=SanFrancisco/O=Showcase/CN=\`hostname -i\`" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay.key /etc/ssl/certs" --zone $name && \
    gcloud compute --project $PROJECT ssh $name --command="sudo mv gcprelay.crt /etc/ssl/certs" --zone $name && \
    echo Certs installed on $name - finished) &
done 

wait
echo All servers restarted