---
layout: default
title: Downloads and distributions
nav_order: 2
description: "Where and how to download Offen or install it from other sources."
permalink: /running-offen/downloads-distributions/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Downloads and distributions
{: .no_toc }

Offen is currently distributed in two ways: packaged as a __single binary file__ for Linux, MacOS and Windows or as a __Docker image__. The most recent release [is available here][most-recent], Docker images are hosted on [Docker Hub][docker-hub].

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Release channels

Both for binaries and Docker images you can use one of these channels to pick your download:

### Tagged releases
{: .no_toc }

In case you want to deploy Offen, this channel is what you are most likely going to use. When ready, we cut official releases and tag them with a version identifier (e.g. `v0.1.0`). These releases are immutable and will never change, so both a download and the Docker image are guaranteed to provide the exact same build every time.

### Stable channel
{: .no_toc }

The `stable` channel gives you the most recent build from the `master` branch of our repository. These are usually stable and ready to use. Be aware that there is not necessarily an upgrade path in between `stable` versions.

### Latest channel
{: .no_toc }

The `latest` channel gives you the most recent build from the `development` branch of our repository. This is likely to contain things that are not production ready or bring other kinds of caveats. __You probably should not use this__ unless you are participating in the development of Offen.

---

## Downloading binary files

Binary files can be downloaded from our [GitHub repository][repo-releases] or using `get.offen.dev`. The most recent release [is available here][most-recent].

Downloading `https://get.offen.dev` will give you a tarball containing the most recent tagged release. If you specify a version or channel like `https://get.offen.dev/v0.1.0-alpha.8` you will download that specific version.

```sh
# most recent release
curl -L https://get.offen.dev
# most recent build from the latest channel
curl -L https://get.offen.dev/latest
# build for {{ site.offen_version }}
curl -L https://get.offen.dev/{{ site.offen_version }}
```

---

__Heads Up__
{: .label .label-red }

The archive file currently contains the binaries __for all supported operating systems__, so no matter which OS you are targeting, you will always download the same file.

[repo-releases]: https://github.com/offen/offen/releases
[most-recent]: https://get.offen.dev

## Verifying the binaries' signatures

To prevent unwanted modifications of our releases, we sign all binaries using GPG and include the signature in our distribution. You can run the following commands to verify the integrity of your download:

```
curl https://keybase.io/hioffen/pgp_keys.asc | gpg --import
gpg --verify offen-linux-amd64.asc offen-linux-amd64
```

## Pulling the Docker image

Docker images are available as `offen/offen` on [Docker Hub][docker-hub]. Tagged releases are available under the respective tag (e.g. `offen/offen:v0.1.0`). The `stable` and `latest` channel are available as image tags as well.

```sh
# {{ site.offen_version }} release
docker pull offen/offen:{{ site.offen_version }}
# latest channel
docker pull offen/offen:latest
```

---

__Heads Up__
{: .label .label-red }

While our version tags on Docker Hub are immutable and __will always return the same build__, it is important to note that both `stable` and `latest` will be updated on a rolling basis. If you deploy Offen using Docker, make sure to use a version tag or pin your image's revision.

[docker-hub]: https://hub.docker.com/r/offen/offen

---

## Click-To-Deploy

We currently also offer "Click-To-Deploy" packages for the following hosting providers:

### Heroku

You can deploy Offen to Heroku using our [deployment template][heroku-repo]. We also offer a [tutorial on this website][heroku-tutorial].

[heroku-repo]: https://github.com/offen/heroku
[heroku-tutorial]: /running-offen/tutorials/configuring-deploying-offen-heroku/
