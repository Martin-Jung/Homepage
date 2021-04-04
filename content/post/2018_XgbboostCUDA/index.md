+++
title = "Using the GPU for gradient descent boosting"
date = 2018-11-16
draft = false

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ["rstats","boosting","gpu"]
categories = ['statistics']

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
[image]
  # Caption (optional)
  caption = ""

  # Focal point (optional)
  # Options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
  focal_point = ""
+++

Running machine learning algorithms on large amounts of data can take considerable time. There are multiple ways of speeding up your code. The most obvious is to properly parallize your code and/or - assuming R or python is used - replace certain functions that cause a bottleneck to faster languages such as C++ or [Julia](https://julialang.org/). What also works is to simply have more computational power. In a previous [post]({{< ref "/post/2018_DataScienceInGoogleCloud" >}}) I elaborated on how to make use of the google cloud processing platform. Rather than CPU power another, often overlooked way, is to rely a bit more on the graphical processing unit (GPU) of the computer. Obviously this can be done in the cloud as well.

Here is some data that I briefly worked on during my PhD. Those are globally distributed crowd-sourced land cover training sites from [Fritz *et al.* (2016)](https://www.nature.com/articles/sdata201775). They contain information about land cover broadly following the LCCS global land cover legend. For all sites I extracted spectral data from the MODIS satellites as well some other environmental data such as precipitation and elevation range or slope.

Here is how the data looks:
```r
# Load packages
library(caret)        # harmonized model
library(xgboost)      # Extreme Gradient Boosting
library(doParallel)		# parallel processing
library(mlbench)      # machine learning optimization routines
library(tidyverse)        # Used by caret
library(lubridate) # For time series objects
library(gbm)				  # GBM Models
library(jsonlite) # For the training data
library(ggplot2); library(scales)
library(GGally) # For sophisticated plotting

# Load only the high resolution data (tagged used high-res images)
training_fritz <- readRDS("TrainingFritzPrepared.rds") %>% dplyr::filter(Resolution == 1) # Only high resolution

# These are land cover categories considered
cols = c(Mosaic..Cultivated.and.managed...Natural.vegetation= "brown",
         Tree.cover = "darkgreen",
         Shrub.cover = "lightgreen",
         Herbaceous.vegetation...Grassland = "orange",
         Urban = "black",
         Cultivated = "red",
         Barren = "grey",
         Water = "blue")

# Lets plot them
gp <- ggpairs(data=training_fritz[,c("Label","EVI2","NBR","NDMI")],
              columns = c("EVI2","NBR","NDMI"),#diag="blank",
              mapping=ggplot2::aes(colour = Label,alpha=.5))

# ------- #
for (row in seq_len(gp$nrow))
  for (col in seq_len(gp$ncol))
    gp[row, col] <- gp[row, col] + ggplot2::scale_color_manual(values = cols) + scale_fill_manual(values = cols)
gp

```

{{< figure src="pairs.png" title="Paired correlation plot between all land cover classes and some vegetation indicators" >}}

# Extreme Gradient descent boosting
Gradient descent boosting methods commonly rule the leaderboard of most data science competitions with especially the [Xgboost](https://en.wikipedia.org/wiki/Xgboost) being one of the most applied algorithms for feature learning and prediction.
Lets try to predict land cover using this dataset

```R

# First we create a training and out-of-bag testing dataset

set.seed(31337) # Specfiy randomized seed
# Create data partition
samp <- createDataPartition(training_fritz$Label, p = 0.75, list = FALSE)
# Split into training input and validate
training <- training_fritz[samp,]  # ~ 4568 rows
test <- training_fritz[-samp,] # OOB observations

# Repeated cross validation for control for caret
ctrl <- trainControl(
  method="repeatedcv", # cross validation
  number=10, # 10-fold
  repeats = 5, # 5 times
  savePredictions="final",
  index=createResample(training$Label, 25), # The index for the ensemble
  classProbs=TRUE,
  allowParallel = TRUE,
  verboseIter = TRUE # Verbose output
)

# Tuning parameters
# Not going to specify anything here, but ideally one should have wide grid of parameters
#tg.xgb <- expand.grid(nrounds = seq(125,200,by=25), lambda = c(0,0.01,0.001,0.0001,0.00001), alpha = c(0,0.01,0.001,0.0001,0.00001),eta= 0.3)

# Now train
x1 <- Sys.time()
mod <- caret::train(as.formula( "Label ~ red + green + blue + nir + lst + swir1 + swir2 + elevation + slope + precip_range + NDVI + NDMI"),
                  data = training,
                  method = "xgbTree", # xgb with Tree baselearner
                  metric = "Accuracy",
                  trControl = ctrl,
                  na.action = na.pass
)
Sys.time() - x1

predict
```
{{< figure src="boostFullCPU.png" title="CPU cores on my laptop heavily at work..." >}}

The whole process takes on my relatively fast (ot at least it fast a few years ago) Thinkpad P50 laptop roughly __14.27__ minutes. The highest accuracy on the training data alone of this model was **0.7646**, while the accuracy on the withold OOB data was **0.7831** ( Kappa : 0.7208 ), which is fair.

<hr>
Now lets execute the same model but with enabled CUDA support. **Note** that in order to do this you need to have a [GPU that support CUDA](https://en.wikipedia.org/wiki/CUDA#GPUs_supported). My Laptop has a Quadro 1000M GPU, which is certainly not the fastest, but should do the trick. Furthermore xgboost has not by default GPU enabled so you need to recompile it before doing this.
Here is how I did this on my Linux machine **Remember to deinstall the xgboost package first**

```bash
git clone --recursive https://github.com/dmlc/xgboost
cd xgboost
mkdir build
cd build
cmake .. -DUSE_CUDA=ON -DR_LIB=ON
make install -j
```
If everything worked fine you should have a new package with GPU support. I had to relink my gcc++ libraries and getting the correct cuda version installed took some time.
Now lets rerun:

```R
# For GPU processing reset the parallel processer as I have a single GPU
ctrl <- trainControl(
  method="repeatedcv", # cross validation
  number=10, # 10-fold
  repeats = 5, # 5 times
  savePredictions="final",
  index=createResample(training$Label, 25), # The index for the ensemble
  classProbs=TRUE,
  allowParallel = F,
  verboseIter = TRUE # Verbose output
)

x1 <- Sys.time()
mod_gpu <- caret::train(as.formula( "Label ~ red + green + blue + nir + lst + swir1 + swir2 + elevation + slope + precip_range + NDVI + NDMI"),
                    data = training,
                    method = "xgbTree", # xgb with Tree baselearner
                    metric = "Accuracy",
                    updater = 'grow_gpu',
                    tree_method = "gpu_exact",
                    trControl = ctrl,
                    na.action = na.pass
)
Sys.time() - x1

```
Total execution speed now is down to __12.42__ minutes! Quite decent for my old GPU, but I guess a more powerful CPU might get even more out of it.

Some inspiration for this blogpost came from this PeerJ manuscript:

- Mitchell R, Frank E. (2017) Accelerating the XGBoost algorithm using GPU computing. PeerJ Computer Science 3:e127 https://doi.org/10.7717/peerj-cs.127
