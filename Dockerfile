FROM alpine

RUN apk update --no-cache && \
    apk add --no-cache nodejs && \
    mkdir -p /app/data

WORKDIR /app
ADD entry.js run.js mappings.js /app/
ADD series.json /app/data
ADD src /app/src
COPY node_modules /app/node_modules
ENTRYPOINT ["node", "run.js" ]