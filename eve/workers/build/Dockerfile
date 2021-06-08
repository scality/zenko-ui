FROM ubuntu:18.04

#
# Install packages needed by the buildchain
#
ENV LANG C.UTF-8
RUN apt update && apt install -y curl apt-transport-https gnupg
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -

COPY ./zenko_packages.list ./buildbot_worker_packages.list ./cypress_packages.list /tmp/
RUN apt-get update \
    && cat /tmp/*packages.list | xargs apt-get install -y

# Install docker
ARG DOCKER_VERSION=18.06.1~ce~3-0~ubuntu
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - \
 && echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee -a /etc/apt/sources.list.d/docker-ce.list \
 && apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    docker-ce=${DOCKER_VERSION} \
&& rm -rf /var/lib/apt/lists/* /var/cache/apt \
&& rm -f /tmp/packages.list

#
# Add user eve
#
RUN adduser -u 1042 --home /home/eve --disabled-password --gecos "" eve \
    && adduser eve sudo \
    && sed -ri 's/(%sudo.*)ALL$/\1NOPASSWD:ALL/' /etc/sudoers

#
# Run buildbot-worker on startup
#
ARG BUILDBOT_VERSION
RUN pip install buildbot-worker==$BUILDBOT_VERSION

WORKDIR /home/eve/workspace
CMD buildbot-worker create-worker . "$BUILDMASTER:$BUILDMASTER_PORT" "$WORKERNAME" "$WORKERPASS" \
    && buildbot-worker start --nodaemon
