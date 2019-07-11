if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Restarting server - $name && \
    gcloud compute  --project $PROJECT instances reset $name --zone $name && \
    echo Restarting server - $name - finished) &
done 

wait
echo All servers restarted