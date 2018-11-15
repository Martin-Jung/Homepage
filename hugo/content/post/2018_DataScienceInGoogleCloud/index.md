+++
title = "Data science in the Google cloud - [1]"
date = 2018-06-17
draft = false

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ['cloud-computing','data','python','google-cloud']
categories = ['data-science','cloud-computing']

# Featured image
# Place your image in the `static/img/` folder and reference its filename below, e.g. `image = "example.jpg"`.
# Use `caption` to display an image caption.
#   Markdown linking is allowed, e.g. `caption = "[Image credit](http://example.org)"`.
# Set `preview` to `false` to disable the thumbnail in listings.
[header]
image = ""
caption = ""
preview = true

+++

Anyone analysing __big data__ (buzzword, here refereed to as data too big to load into memory) soon will come to the realization that processing such data requires a lot of computational resources. During my PhD I mainly worked with the local high-performance-computer (HPC) at the University of Sussex. A couple of years into my PhD and I increasingly realized that our little HPC suffers from the [tragedy of the commons](https://en.wikipedia.org/wiki/Tragedy_of_the_commons) with more and more people requesting computation time on a few available nodes.  That and also the tendency to have limited flexibility for running customized code (no root access, outdated modules and libraries, little space on the home drive to set up virtual environments, etc. ...) has made me quite frustrated and willing to switch to the "Cloud" for accessing computing resources.
\

Cloud computing these days is well established, but mainly concentrated in the hands of three leading US firms. As far as I am aware one basically has to choose between Amazon AWS, Microsoft Azure and Google Cloud programs. Each have their own benefits and I leave it to the reader to search elsewhere for information on which one to chose.
\

I picked the [Google cloud free trial offer](https://cloud.google.com/free-trial/) partly because of the following reasons:

* They have a 300$ give away. (I think Microsoft and Amazon offer sth. similar though)

* The free trial period lasts 12 months after which it runs out without incurring further cost. Furthermore there will remain a [free-use contingent](https://cloud.google.com/free/) which can be exhausted for free. You fire up some use time on a f1-micro VM for instance.

* I am increasingly using [Google's Earth Engine platform](https://earthengine.google.com/) and plan to use Google cloud storage to enhance my workflow.

* Private 1GB Git hosting (now especially useful since Competitor Microsoft has acquired Github )


That being said, I have also heard great things about AWS and Azure as well and might try them out at a later point as well.

<hr>

So here is how I started. My goal was to first get familiar with computing in the cloud and try to install some standard tools. Therefore
First I fired up a micro instance **V**irtual **M**achine (which, in the google cloud, you can run over 700h each month for free).
![Micro instance in Google cloud ](/img/posts/GoogleCloudInstance.png)
On the SSH button you have the opportunity to directly log into your cloud instance in the browser or in another ssh-client of you choosing.
Each VM can be selected and also started / stopped or completly reseted in this screen as well (also via the ***"..."*** button!)
\
I'm going to install some basic data-science tools.
Here is the entire thing as bash-script to be executed on the next, bigger, VM in a later stage ;-)

```bash
# First lets install some necessary libraries
sudo apt-get -y install bzip2
sudo apt-get -y install screen

# Make a update and upgrade all, then clean up
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y autoremove

# Make download folder
mkdir downloads
cd downloads
# Download anaconda
wget https://repo.continuum.io/archive/Anaconda2-5.2.0-Linux-x86_64.sh
# Install in the background (accept and updating any previous installations)
bash Anaconda2-5.2.0-Linux-x86_64.sh -b -u -p $HOME/anaconda2
echo "export PATH=\"~/anaconda2/bin:$PATH\"" >> ~/.bashrc
# Reload conf
source ~/.bashrc

# Install R
# Add debian stretch repo and key, then install
echo "deb http://cran.rstudio.com/bin/linux/debian stretch-cran35/" | sudo tee -a /etc/apt/sources.list
sudo apt-key adv --keyserver keys.gnupg.net --recv-key 'E19F5F87128899B192B1A2C2AD5F960A256A04AF'
sudo apt-get update
sudo apt-get install -y r-base r-base-core r-base-dev
sudo apt-get install -y libatlas3-base

# Also install rstudio keyserver
sudo apt-get -y install psmisc libssl-dev libcurl4-openssl-dev libssh2-1-dev
wget https://download2.rstudio.org/rstudio-server-stretch-1.1.453-amd64.deb
sudo dpkg -i rstudio-server-stretch-1.1.453-amd64.deb

# Also install julia for later
sudo apt-get -y install julia

```
**Note to myself**: For the future it might be easier to configure an analysis-ready docker image. Sth. to do for later...
\

Now we create a new configuration for a jupyter notebook and start it on the vm.

```bash
# Create config
jupyter notebook --generate-config

# Add this to the configure
echo "c = get_config()" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.ip = '*'" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.open_browser = False" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.port = 8177" >> ~/.jupyter/jupyter_notebook_config.py

# Set a password
jupyter notebook password

# Start up
jupyter-notebook --no-browser --port=8177

```

The jupyter notebook can now be theoretically viewed in a browser. However we have to get access to the Google cloud intranet first. For this we will use the [google cloud SDK](https://cloud.google.com/sdk/), which you need to install on your local computer as well.

Then execute for the google cloud sdk:
```bash
# After installation: auth
gcloud init

# The open a SSH tunnel. For me that is:
gcloud compute ssh  --zone=us-central1-c --ssh-flag="-D" --ssh-flag="8177" --ssh-flag="-N" --ssh-flag="-n" wolkentest
# If you have never done before, you will need to create a public/private ssh key
```

Now that you have created a SSH tunnel you can just open your local browser (ie. Chrome or similar) and navigate towards [localhost:8177](localhost:8177) and you should see your jupyter notebook. Happy computing!
![Jupyter running through an SSH tunnel](/img/posts/GoogleCloudJupyterRunning.png)
{{% alert warning %}}
At the end, ensure that the VM is turned off, otherwise it will create ongoing costs!
{{% /alert %}}
