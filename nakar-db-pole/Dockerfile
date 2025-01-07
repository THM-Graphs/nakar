FROM neo4j:5.25

ENV NEO4J_PLUGINS="[\"apoc\", \"graph-data-science\"]"
ENV NEO4J_browser_post__connect__cmd="play https://guides.neo4j.com/sandbox/pole/index.html"

COPY nakar-db-pole/pole-50.dump /dump/neo4j.dump
RUN neo4j-admin database load neo4j --from-path=/dump --overwrite-destination=true

HEALTHCHECK  \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD wget --quiet --spider http://localhost:7474 || exit 1

CMD ["neo4j"]
