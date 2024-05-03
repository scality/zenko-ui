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
docker pull ghcr.io/zenko-ui-dev/zenko-ui:<commit hash>
docker pull ghcr.io/zenko-ui/zenko-ui:<tag>
```

## Release Process

To release a production image:

* Name the tag for the repository and Docker image.

* Use the `npm version` command with the same tag to update `package.json`.

* Create a PR and merge the `package.json` change.

* Trigger the [Release Workflow] via the workflow dispatch function.
  Fill the form information, select the desired branch and run it.

[Release Workflow]:
https://github.com/scality/zenko-ui/actions/workflows/release.yaml
