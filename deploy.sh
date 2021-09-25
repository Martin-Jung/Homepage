#!/bin/sh
rm -rf public/*
cd public
cp -Rfv public/* ../
cd ..
# Now download latest build
git pull
# Recreate
hugo serve
# Copy result to html
sudo cp -a public/. /var/www/html/
echo 'Deployed'
