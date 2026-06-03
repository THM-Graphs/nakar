FROM neo4j:5.25

# ENV NEO4J_PLUGINS="[\"apoc\", \"graph-data-science\"]"

COPY import /import
RUN neo4j-admin database import full \
    --nodes=/import/nodes/authors/nodes.csv \
    --nodes=/import/nodes/institutions/nodes.csv \
    --nodes=/import/nodes/conferences/nodes.csv \
    --nodes=/import/nodes/works/nodes.csv \
    --relationships=/import/edges/authors/relationships.csv \
    --relationships=/import/edges/institutions/relationships.csv \
    --relationships=/import/edges/conferences/relationships.csv \
    --relationships=/import/edges/works/relationships.csv \
    --verbose

ENV NEO4J_server_databases_read__only=true

HEALTHCHECK  \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD wget --quiet --spider http://localhost:7474 || exit 1

CMD ["neo4j"]
