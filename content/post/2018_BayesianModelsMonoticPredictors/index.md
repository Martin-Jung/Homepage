+++
title = "Testing multilevel Bayesian models with ordered categorical predictors"
date = 2018-11-05
draft = false

# Authors. Comma separated list, e.g. `["Bob Smith", "David Jones"]`.
authors = []

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ["rstats","bayesian statistics","PREDICTS"]
categories = ['data-science','phd','statistics']

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["deep-learning"]` references
#   `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
 projects = []

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
[image]
  # Caption (optional)
  caption = ""

  # Focal point (optional)
  # Options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
  focal_point = "Center"

+++

Why argue for Bayesian models? Most researchers and data scientists have specific  - domain - knowledge about the subject they analyse data for. In a Bayesian analysis framework this knowledge can be refereed to as *Prior* and the effect und uncertainty surrounding this. Most standard analytical tools do not account for this information. In fact **every** statistical tool makes some kind of assumptions about your data. Computers do not now *per se* how your data looks or what limits it. By not providing this kind of information, the algorithm essentially has to guess or make uninformed assumptions, which can be quite unrealistic in applied settings.

Or as Richard McElreath puts it:
{{< tweet 1032318199713460224 >}}

Here is an example using data from one of my PhD chapters where I worked with the [PREDICTS database](https://onlinelibrary.wiley.com/doi/full/10.1002/ece3.2579), a global database of local biodiversity records. A particular feature of the PREDICTS data collection is that the sites of biodiversity sampling are "re-categorized" into land-use categories such as *Primary vegetation* or *Pasture*.

A number of high-profile papers have been produced using PREDICTS data such as the one by my old supervisor, who used Hierarchical linear mixed effects models to estimate the average difference in species richness with land use globally
[(Newbold et al. 2015)](http://discovery.ucl.ac.uk/1464937/1/Newbold%20etal%202015%20Nature%20Submitted.pdf). Have a look at Newbold *et al.* for more information about the study design and methods.

The interesting question here is:
**Should we consider land use as a monotonic gradient?** Or in other words: Do we expect that the difference between all categories other than the intercept (Primary vegetation) is negative, so a loss in species richness?
<br>
Another information that we can include is the expected difference or slope of local species loss. For instance we also can't have more than 100 % loss of species richness for any site, so we have thus information about the - prior - distribution of the expected slope

Most PREDICTS data has been released and is openly available through the [National History Museum London](http://data.nhm.ac.uk/dataset/the-2016-release-of-the-predicts-database) and it should be possible to prepare a data frame similar to the one I used here.

<br>
Lets first fit a roughly comparable model to Newbold et al. 2015:

```r
# Load packages and data for this project
library(tidyverse)
library(tidybayes)
library(brms)
library(lme4)
library(sjPlot)

# Load biodiversity site dataset
sites <- readRDS("~/../PhD/Projects/P5_MagnitudeBreakpoints/PREDICTS_allsites.rds")
# Merge primary vegetation to single category as reference
sites <- subset(sites,Predominant_habitat != "Cannot decide")# Drop Cannot decide from the factors
sites$Predominant_habitat <- fct_collapse(sites$Predominant_habitat,"Primary vegetation" = c("Primary forest","Primary non-forest"))

# Here all the categories we consider
sites$Predominant_habitat <- factor(sites$Predominant_habitat,
                                    levels = c("Primary vegetation","Young secondary vegetation","Intermediate secondary vegetation","Mature secondary vegetation",
                                               "Secondary vegetation (indeterminate age)","Plantation forest","Pasture","Cropland","Urban"),
                                    ordered = T)
sites$SS <- factor(sites$SS)

# A prediction container for later
nd <- data.frame(Predominant_habitat = factor(levels(sites$Predominant_habitat),levels = levels(sites$Predominant_habitat),ordered = T) ) # Prediction frame

# A function to transform all estimates relative to the intercept (that is primary vegetation)
relIntercept <- function(df){
  return( df %>% group_by(model) %>%
    mutate(fit = ( fit / fit[which(Predominant_habitat=="Primary vegetation")])-1,
           fit.low = (fit.low / fit[which(Predominant_habitat=="Primary vegetation")])-1,
           fit.high = (fit.high / fit[which(Predominant_habitat=="Primary vegetation")])-1
    ) %>% ungroup()
  )
}

# First for lme4 using a "classic" predicts model and reproduce a model similar to Newbold et al. 2015
# As simple test we on use two random intercepts, the study and a spatial block within study
fit1 <- glmer(Species_richness ~ Predominant_habitat + (1|SS) + (1|SSB),
              data = sites,family = poisson(link = "log"))

# Save output
out <-
  data.frame(
  Predominant_habitat = nd$Predominant_habitat,
  fit = predict(fit1,newdata=nd,re.form=NA,type = "link"),
  fit.se = arm::se.fixef(fit1), # Get the standard error of the coefficients
  model = "lme4"
) %>% mutate(
  fit.low = exp((fit - fit.se*1.96)), # naively multiply the wald standard errors with 1.96
  fit.high = exp((fit + fit.se*1.96)),
  fit = exp(fit)
)

```
Now lets create a similar model using a Bayesian framework. Here I will use the excellent *brms* package to skip the lengthy procedure of writing Stan code myself. This is a **very** simple model for demonstration purposes and can very likely quite improved.

The Equation for the bayesian multi-level model :

$$
\\begin{eqnarray}
\\text{Species richness}\_i & \\sim & \\text{Poisson} (\\mu\_i) \\\\\\
\\text{log} (\\mu\_i) & = & \\alpha + \\alpha\_{\\text{Study}\_i} + \\alpha\_{\\text{Spatial block}\_i} + \\beta (\\text{Land use}\_i) \\\\\\
\\beta & \\sim & \\text{Normal} (0, 1) \\\\\\
\\alpha\_{\\text{Study,Spatial block}} & \\sim & \\text{Normal} (0, \\sigma\_{\\text{Study,Spatial block}}) \\\\\\
\\sigma\_{\\text{Study,Spatial block}} & \\sim & \\text{HalfCauchy} (0, 2) \\\\\\
\\end{eqnarray}
$$
Priors for both intercepts are identical although one could argue that the spatial block should be specified differently given that it is nested within study.

and can be fitted like thos:
```r
fit2 <- brm(Species_richness ~ Predominant_habitat + (1|SS) + (1|SSB),
            data = sites,family = poisson(link = "log"),
            prior = prior(normal(0,1), class = b) + # Normal distributed prior for beta
              prior(cauchy(0,2), class = sd), # Half cauchy prior for uncertainty
            chains = 2, cores = 6, iter = 2000) # Fit using 6 cores and 2000 iterations of 2 MCMC chains

# ... This takes a while.
# Made myself dinner

# How did we do?
# (showing only the intercept)
plot(fit2, ask =F)
```
{{< figure library="1" src="posts/brmsMCMCchains.png" title="" caption="There are some irregularities in the iterations of the MCMC that do not look completely random yet and more interations might help. Or alternatively specifying a prior for the intercept :) " >}}

<br>
Lets compare the two models in their predicted impact of land use on species richness.

```r
# Get the prediction from the bayesian model
out <- bind_rows(out,
                 # Summarise from the fitted posterior values
                 fitted_draws(fit2,nd,re_formula = NA) %>% group_by(Predominant_habitat) %>% mean_qi(.value) %>%
                   select(Predominant_habitat,.value,.lower,.upper) %>% rename(fit = ".value",fit.low = ".lower", fit.high = ".upper") %>%
                   mutate(fit.se = NA, model = "brms1")
)

# Plot them both
ggplot(out %>% relIntercept(.),
       aes(x = fct_rev( Predominant_habitat ), y = fit, ymin = fit.low, ymax = fit.high, group = model, color =model)) +
  theme_default() + coord_flip()+
  geom_pointrange(position = position_dodge(.5)) + geom_hline(yintercept = 0, linetype = "dotted")+
  scale_y_continuous(breaks = scales::pretty_breaks(5)) +
  scale_colour_brewer(palette = "Set1") +
  labs(x="",y = "Predicted difference in Species richness") + theme(axis.text.x = element_text(size = 15))

```

{{< figure library="1" src="posts/brmsModelcoef1.png" title="" caption="Ignore the error bars for now as they are not directly comparable (see below)." >}}
It is noteworthy that the uncertainty for lme4 is the estimated standard error of the fitted object (**!**), while for brms the estimation error is drawn only from the fitted values of the posterior.

Still so far both models are quite similar and indicate comparable, mean losses of species richness as shown in the Newbold et al. 2015 Nature paper.
<br>

Now here comes the interesting part. Paul Brückner, the author of the *brms* R package has recently released a new [preprint](https://psyarxiv.com/9qkhj) discussing the addition of monotonic effects to the *brms* package. [Monotonic functions](https://en.wikipedia.org/wiki/Monotonic_function) can be applied ordinal predictors for which a monotonic relationship (increasing, decreasing, concave, convex) is highly plausible.

Fitting those kind of models in brms is now straight forward. We use the default uniform Dirichlet priors which according to Brückner generalize well.

```
fit3 <- brm(Species_richness ~ mo(Predominant_habitat) + (1|SS) + (1|SSB),
            data = sites,family = poisson(link = "log"),
            prior = prior(normal(0,1), class = b) + prior(cauchy(0,2), class = sd),
            chains = 2, cores = 6, iter = 2000)

# Lets compare both models
waic(fit2,fit3)
```
It does seem that the model without a monotonic effect is a better fit to the data.
```bash
                WAIC     SE
fit2        170240.73 990.35
fit3        170533.55 997.99
fit2 - fit3   -292.82  99.12
```

How do the fitted effects compare ?
Quite differently. Notice how local species richness *monotonically* declines with every further "level" of land use.

{{< figure library="1" src="posts/brmsModelcoef2.png" title="" caption="" >}}

Overall it does seem as if we have to reject the idea of "land-use gradients" at least if those gradients are quantified through categorical entities. One could argue that some - human altered - land-use categories can have higher number of species than some natural land use. Thinking for example of urban habitats for plants (lots of gardens, exotics and non-natives).

In my PhD I try to find ways to capture land dynamics on a continuous unit scale rather than through categorical estimates. Look our for new results of this idea soon...

**Sessioninfo**
```
R version 3.4.4 (2018-03-15)
Platform: x86_64-pc-linux-gnu (64-bit)
Running under: Ubuntu 18.04.1 LTS

Matrix products: default
BLAS: /usr/lib/x86_64-linux-gnu/blas/libblas.so.3.7.1
LAPACK: /usr/lib/x86_64-linux-gnu/lapack/liblapack.so.3.7.1

locale:
 [1] LC_CTYPE=en_GB.UTF-8       LC_NUMERIC=C               LC_TIME=en_GB.UTF-8        LC_COLLATE=en_GB.UTF-8    
 [5] LC_MONETARY=en_GB.UTF-8    LC_MESSAGES=en_GB.UTF-8    LC_PAPER=en_GB.UTF-8       LC_NAME=C                 
 [9] LC_ADDRESS=C               LC_TELEPHONE=C             LC_MEASUREMENT=en_GB.UTF-8 LC_IDENTIFICATION=C       

attached base packages:
[1] parallel  stats     graphics  grDevices utils     datasets  methods   base     

other attached packages:
 [1] tidybayes_1.0.3 bindrcpp_0.2.2  sjPlot_2.6.1    mboost_2.9-1    stabs_0.6-3     lme4_1.1-19     Matrix_1.2-14  
 [8] brms_2.6.0      Rcpp_1.0.0      forcats_0.3.0   stringr_1.3.1   dplyr_0.7.8     purrr_0.2.5     readr_1.1.1    
[15] tidyr_0.8.2     tibble_1.4.2    ggplot2_3.1.0   tidyverse_1.2.1

loaded via a namespace (and not attached):
  [1] readxl_1.1.0              backports_1.1.2           plyr_1.8.4                igraph_1.2.2             
  [5] lazyeval_0.2.1            svUnit_0.7-12             TMB_1.7.15                splines_3.4.4            
  [9] crosstalk_1.0.0           TH.data_1.0-9             rstantools_1.5.1          inline_0.3.15            
 [13] digest_0.6.18             htmltools_0.3.6           rsconnect_0.8.11          lmerTest_3.0-1           
 [17] fansi_0.4.0               magrittr_1.5              modelr_0.1.2              matrixStats_0.54.0       
 [21] xts_0.11-2                sandwich_2.5-0            prettyunits_1.0.2         colorspace_1.3-2         
 [25] rvest_0.3.2               haven_1.1.2               callr_3.0.0               crayon_1.3.4             
 [29] jsonlite_1.5              libcoin_1.0-1             bindr_0.1.1               survival_2.42-3          
 [33] zoo_1.8-4                 glue_1.3.0                gtable_0.2.0              nnls_1.4                 
 [37] emmeans_1.3.0             sjstats_0.17.2            sjmisc_2.7.6              pkgbuild_1.0.2           
 [41] rstan_2.18.2              abind_1.4-5               scales_1.0.0              mvtnorm_1.0-8            
 [45] ggeffects_0.6.0           miniUI_0.1.1.1            xtable_1.8-3              HDInterval_0.2.0         
 [49] ggstance_0.3.1            foreign_0.8-70            Formula_1.2-3             stats4_3.4.4             
 [53] prediction_0.3.6          StanHeaders_2.18.0        DT_0.5                    htmlwidgets_1.3          
 [57] httr_1.3.1                threejs_0.3.1             arrayhelpers_1.0-20160527 RColorBrewer_1.1-2       
 [61] modeltools_0.2-22         pkgconfig_2.0.2           loo_2.0.0                 utf8_1.1.4               
 [65] labeling_0.3              tidyselect_0.2.5          rlang_0.3.0.1             reshape2_1.4.3           
 [69] later_0.7.5               munsell_0.5.0             cellranger_1.1.0          tools_3.4.4              
 [73] cli_1.0.1                 sjlabelled_1.0.14         broom_0.5.0               ggridges_0.5.1           
 [77] arm_1.10-1                yaml_2.2.0                processx_3.2.0            knitr_1.20               
 [81] coin_1.2-2                nlme_3.1-137              mime_0.6                  xml2_1.2.0               
 [85] debugme_1.1.0             compiler_3.4.4            bayesplot_1.6.0           shinythemes_1.1.2        
 [89] rstudioapi_0.8            stringi_1.2.4             ps_1.2.1                  Brobdingnag_1.2-6        
 [93] lattice_0.20-35           psych_1.8.10              nloptr_1.2.1              markdown_0.8             
 [97] shinyjs_1.0               stringdist_0.9.5.1        pillar_1.3.0              pwr_1.2-2                
[101] bridgesampling_0.6-0      estimability_1.3          data.table_1.11.8         httpuv_1.4.5             
[105] R6_2.3.0                  promises_1.0.1            gridExtra_2.3             codetools_0.2-15         
[109] colourpicker_1.0          MASS_7.3-50               gtools_3.8.1              assertthat_0.2.0         
[113] withr_2.1.2               shinystan_2.5.0           mnormt_1.5-5              multcomp_1.4-8           
[117] hms_0.4.2                 quadprog_1.5-5            grid_3.4.4                rpart_4.1-13             
[121] coda_0.19-2               glmmTMB_0.2.2.0           minqa_1.2.4               inum_1.0-0               
[125] snakecase_0.9.2           partykit_1.2-2            numDeriv_2016.8-1         shiny_1.2.0              
[129] lubridate_1.7.4           base64enc_0.1-3           dygraphs_1.1.1.6
```
