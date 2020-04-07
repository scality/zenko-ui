FROM ubuntu:bionic

#
# Install packages needed by the buildchain
#
ENV LANG C.UTF-8
RUN apt update && apt install -y curl apt-transport-https gnupg
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -

COPY ./pensieve_packages.list ./buildbot_worker_packages.list /tmp/
RUN apt-get update \
    && cat /tmp/*packages.list | xargs apt-get install -y \
    && pip install pip==9.0.1 awscli==1.16.20 \
    && rm -rf /var/lib/apt/lists/* \
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
