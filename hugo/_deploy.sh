#!/bin/sh
rm -rf public/*
hugo
cd  public
cp -Rfv public/* ../
git add ../
git commit -m "Updating..." || true
git push master

rm -rf public/*
