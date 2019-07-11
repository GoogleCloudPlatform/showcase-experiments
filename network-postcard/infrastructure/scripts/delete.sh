if [ ${#1} -gt 0 ]; then
    list=$1
else
    list=$(<.list)
fi

source ../../Makefile.properties

for name in $list; do
    (echo Deleting $name && \
    gcloud compute --project $PROJECT instances delete $name --zone $name   -q && \
    echo Deleting $name - finished) &
done 

wait
echo All servers delete