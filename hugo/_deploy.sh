#!/bin/sh

set -e

rm -r public/
hugo
cd  public
cp -r ../public/* ./
git add --all *
git commit -m "Updating..." || true
git push -q origin master
