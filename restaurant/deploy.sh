#!/bin/sh
yarn deploy
rsync -avP build/ root@159.89.201.140:/opt/dtml/wordbattle --delete
