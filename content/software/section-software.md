---
# An instance of the Blank widget.
# Documentation: https://wowchemy.com/docs/page-builder/
widget: blank

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 3

# Section title
title: Software

# Section subtitle
subtitle: Software and scripts I created

# Section design
design:
  # Use a 1-column layout
  columns: "2"
  # Use a dark navy background with light text.
  background:
#    color: 'navy'
#    text_color_light: true
---

## Code
### ibis.iSDM - Modelling framework for creating Integrated Biodiversity distribution scenarios

The ibis.iSDM package provides a series of convenience functions to fit integrated Species Distribution Models (iSDMs). With integrated models we generally refer to SDMs that incorporate information from different biodiversity datasets, external parameters such as priors or offsets or constrains such as vital rates with respect to certain variables and regions.

<i class="fab fa-r-project"></i> [Code](https://github.com/iiasa/ibis.iSDM)

___
### LecoS - Land cover statistics QGIS plugin

![Image](https://conservationecology.files.wordpress.com/2012/10/lecos_cor3.png)

LecoS is a Python plugin for the QGIS GIS software suite. It converts classified raster layers to arrays using the powerful numpy library and - based on a Connected Component Labeling approach - allows to further identify class patches and the calculation of landscape metrics. The use can choose to calculate single or several metrics for the raster classes.

<i class="fas fa-scroll"></i> [Manuscript](http://dx.doi.org/10.1016/j.ecoinf.2015.11.006) | <i class="fab fa-python"></i> [Code](https://github.com/Martin-Jung/LecoS) | <i class="fas fa-globe-africa"></i> [QGIS](https://plugins.qgis.org/plugins/LecoS/) | <i class="fab fa-wordpress"></i> [Blog post](https://conservationecology.wordpress.com/qgis-plugins-and-scripts/lecos-land-cover-statistics/)

___
### QSDM - Species Distribution Modelling for the QGIS Processing Toolbox

![Model](https://conservationecology.files.wordpress.com/2014/05/predlycaena_phlaeas.png)

A while ago I created a python plugin with a series of helper functions to conduct species distribution modelling (e.g. trained single class classifiers) for the QGIS software suite. The plugin is released and functional, but due to a lack of time commitment likely won't work on latest QGIS versions (> 3.0) anymore.
The QSDM package adds the following functionalities to the QGIS Processing toolbox:

    Data Analysis
        - Calculate Niche Overlap Statistics
        - Range Shifts
    Data Preperation
        - Create Species Richness Grids
        - Data Transformation (simple)
        - Raster Unification
    Species Distribution Modelling
        - MAXENT (Parameter Preperation)
        - Maximum Entropy Modelling (semi-automatic modelling)
        - Maximum Entropy Modelling (Manual Configuration of parameters)

<i class="fab fa-python"></i> [Code](https://github.com/Martin-Jung/QSDM) | <i class="fas fa-globe-africa"></i> [QGIS](https://plugins.qgis.org/plugins/QSDM/) | <i class="fab fa-wordpress"></i> [Blog post](https://conservationecology.wordpress.com/qgis-plugins-and-scripts/lecos-land-cover-statistics/)

___
### icarus - R package for spatial analysis convenience and analysis functions

I created a package to host a number of convenience functions for handling and manipulating spatial datasets in R. Mainly for my personal use, but hopefully the functions will prove useful for others as well

<i class="fab fa-r-project"></i> [Code](https://github.com/Martin-Jung/Icarus)
