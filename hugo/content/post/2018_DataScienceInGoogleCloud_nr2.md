+++
title = "Running rstudio in the Google cloud - [2]"
date = 2018-08-20
draft = false

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ['cloud-computing','data','r','google-cloud']
categories = ['data-science','cloud-computing']

# Featured image
# Place your image in the `static/img/` folder and reference its filename below, e.g. `image = "example.jpg"`.
# Use `caption` to display an image caption.
#   Markdown linking is allowed, e.g. `caption = "[Image credit](http://example.org)"`.
# Set `preview` to `false` to disable the thumbnail in listings.
[header]
image = "posts/GoogleRstudio.png"
caption = "Rstudio and Google cloud engine"
preview = true

+++

In this new post I will go through my process of getting familiar with running *R* in the Google cloud and the posting sort of follows my previous [post]({{< ref "/post/2018_DataScienceInGoogleCloud.md" >}}) on getting started with the Google cloud. My dream setup would include to being able to switch seamless between running r code locally or in the cloud whenever I require more processing power. For instance similar [doAzureParallel](https://github.com/Azure/doAzureParallel) package available for Microsoft Azure.
<br>
For Google cloud engine, there also exists a neat package called [googleComputeEngineR](https://cloudyr.github.io/googleComputeEngineR/index.html), that allows to easily setup a virtual machine and run code remotely.
So let's setup the googleComputeEngineR package. As always, please note you alone (the dear reader) is responsible to keep track of your virtual machines in the cloud. If you do not stop them (i.e. shut them down), then this will {{< hl >}}cost you money!{{< /hl >}}
<hr>
In order to use the **googleComputeEngineR** package, we first need to create a credentials file. For my google cloud project and personal linux machine I have created such a file on my local system like this:

```bash
# Create the file
touch ~/.Renviron
echo "GCE_AUTH_FILE=\"~/wasserdampf.json\"" >> ~/.Renviron
echo "GCE_DEFAULT_PROJECT_ID=\"wolke7-208420\"" >> ~/.Renviron
echo "GCE_DEFAULT_ZONE=\"us-central1-a\"" >> ~/.Renviron
```
One also needs a service account auth key (here called wasserdampf.json). Find more information how to get such a key [here](https://cloudyr.github.io/googleComputeEngineR/articles/installation-and-authentication.html).
Now for starters lets start R and install the **googleComputeEngineR** package, then start up a virtual machine with Rstudio setup.

## Run a Rstudio in the google cloud ##
```R
llibrary(googleAuthR)
library(googleComputeEngineR)
library(future)

# Start up a rstudio vm (or create if not already existing)
vm <- gce_vm(template = "rstudio",
             name = "rstudio",
             username = "martin", password = "wolkenwind",
             predefined_type = "n1-standard-1" # Available machines via gce_list_machinetype()
)

# See if the vm exists
gce_list_instances()

```

```
> ==Google Compute Engine Instance List==
>      name   machineType  status          zone     externalIP   creationTimestamp
> 1 rstudio n1-standard-1 RUNNING us-central1-a XX.XXX.XXX.XXX 2018-08-23 14:41:45
```

The externalIP gives the ip through which rstudio server can be run in any webbrowser
![Rstudio run in the google cloud](/img/posts/GoogleCloud_Rstudio.png)

Equally it is quite easy to control the VM via SSH directly in the browser and the **googleComputeEngineR** package provides an easy function to open such a connection:
```R
gce_ssh_browser(vm)
```

Lastly ensure that you stop the VM(or delete it).
```R
# Shut down the vm
gce_vm_stop(vm)

# Or delete the vm
gce_vm_delete(vm)
```
