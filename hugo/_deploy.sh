#!/bin/sh
rm -rf public/
hugo
cd  public
cp -r public/* ../*
git add --all ../*
git commit -m "Updating..." || true
git push master

rm -rf public/
