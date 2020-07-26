FROM node:14.5
MAINTAINER sadisticsolutione@gmail.com

ENV REPO="" \
    WEBHOOK=""

ENTRYPOINT tail -f /dev/null
WORKDIR /app

COPY . /app
COPY ./id_rsa /root/.ssh/id_rsa

RUN rm /app/id_rsa \
 && chmod 0600 /root/.ssh/id_rsa \
 && ssh-keyscan github.com >> ~/.ssh/known_hosts \
 && cd /app \
 && npm install
