# Zenko UI Release Plan

## Docker Image Generation

Docker images are hosted on [registry.scality.com](registry.scality.com).
Zenko UI has two namespaces there:

* Production Namespace: registry.scality.com/zenko-ui
* Dev Namespace: registry.scality.com/zenko-ui-dev

With every CI build, the CI will push images, tagging the
content with the developer branch's short SHA-1 commit hash.
This allows those images to be used by developers, CI builds,
build chain and so on.

Tagged versions of Zenko UI will be stored in the production namespace.

## How to Pull Docker Images

```sh
docker pull registry.scality.com/zenko-ui-dev/zenko-ui:<commit hash>
docker pull registry.scality.com/zenko-ui/zenko-ui:<tag>
```

## Release Process

To release a production image:

* Name the tag for the repository and Docker image.

* Use the `npm version` command with the same tag to update `package.json`.

* Create a PR and merge the `package.json` change.

* Tag the repository using the same tag.

* [Force a build] using:
  * A given branch that ideally matches the tag.
  * The `release` stage.
  * An extra property with the name `tag` and its value being the actual tag.

[Force a build]:
https://eve.devsca.com/github/scality/zenko-ui/#/builders/bootstrap/force/force
