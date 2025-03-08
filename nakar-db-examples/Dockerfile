FROM neo4j:5.25

# ENV NEO4J_PLUGINS="[\"apoc\", \"graph-data-science\"]"

COPY nakar-db-examples/import /import
RUN neo4j-admin database import full \
    --nodes=/import/01_multiple_labels/nodes.csv  \
    --relationships=/import/01_multiple_labels/relationships.csv  \
    --nodes=/import/02_many_labels/nodes.csv  \
    --relationships=/import/02_many_labels/relationships.csv  \
    --nodes=/import/03_loops/nodes.csv  \
    --relationships=/import/03_loops/relationships.csv  \
    --nodes=/import/04_names_in_query/nodes.csv  \
    --relationships=/import/04_names_in_query/relationships.csv  \
    --nodes=/import/05_properties/nodes.csv  \
    --relationships=/import/05_properties/relationships.csv  \
    --verbose

ENV NEO4J_server_databases_read__only=true

HEALTHCHECK  \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD wget --quiet --spider http://localhost:7474 || exit 1

CMD ["neo4j"]
