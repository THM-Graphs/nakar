FROM neo4j:2026.10.2-community

ENV NEO4J_PLUGINS="[\"apoc\", \"graph-data-science\"]"
ENV NEO4J_browser_post__connect__cmd="play https://guides.neo4j.com/sandbox/pole/index.html"

COPY pole-50.dump /dump/neo4j.dump
RUN neo4j-admin database load neo4j --from-path=/dump --overwrite-destination=true

ENV NEO4J_server_databases_default__to__read__only=true

HEALTHCHECK  \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD wget --quiet --spider http://localhost:7474 || exit 1

CMD ["neo4j"]
