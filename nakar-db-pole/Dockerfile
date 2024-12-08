FROM neo4j:5.25
RUN pwd
RUN ls -al
COPY pole-50.dump /dump/neo4j.dump
RUN neo4j-admin database load neo4j --from-path=/dump --overwrite-destination=true

CMD ["neo4j"]
