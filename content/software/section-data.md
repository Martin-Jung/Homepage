---
# An instance of the Blank widget.
# Documentation: https://wowchemy.com/docs/page-builder/
widget: blank

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 2

# Section title
title: Data

# Section subtitle
subtitle: Openly available datasets

# Section design
design:
  # Use a 1-column layout
  columns: "2"
  # Use a dark navy background with light text.
  background:
#    color: 'navy'
#    text_color_light: true
---

### Potential distribution of land-cover classes

![PNV](https://zenodo.org/api/iiif/v2/06272a88-e53e-4741-a7e0-1e3911e33bbe:006cdae4-8e02-477c-b2ae-10ccc09c7cf6:001_pnv_predictions_glc100.png/full/750,/0/default.png)

Contributed to the creation of global openly available data on the Potential distribution of land cover classes (Potential Natural Vegetation) at 250 m spatial resolution based on a compilation of data sets (Biome6000k, Geo-Wiki, LandPKS, mangroves soil database, and from various literature sources; total of about 65,000 training points). The map was created using relief and climate variables representing conditions the climate for the last 20+ years and predicted at 250 m globally using an Ensemble Machine Learning approach as implemented in the mlr package for R.

<i class="fab fa-r-project"></i> [Code](https://github.com/Envirometrix/PNVmaps) | <i class="fas fa-database"></i> [Data]( http://doi.org/10.5281/zenodo.4058819)

### Global habitat mapping

![Habitat map](https://raw.githubusercontent.com/Martin-Jung/Habitatmapping/master/screen_lvl2.png)

Using the [Google Earth Engine](https://earthengine.google.com/) platform I developed Javascript code to create the first global habitat map specifically for species habitat analyses. The map is created by intersecting best available global datasets on land cover, climate and land use. The code and map is released under a Creative Commons Attribution 4.0 International license and thus can be freely shared, used or modified. The most recent version of the habitat type layer is uploaded to [Zenodo](http://doi.org/10.5281/zenodo.4058819).

To run the code for creating the habitat type map an account on Google Earth Engine is necessary. No Python code was developed as part of this project. Note that while the code for the habitat type map is openly available, the underlying datasets ('assets' in Google Earth Engine) are not all (yet) publicly available. Assets can be shared depending on the request, however there is no guarantee that I will host all original input assets for long, since they might change as improved data becomes available.

<i class="fas fa-scroll"></i> [Manuscript](https://doi.org/10.1038/s41597-020-00599-8) | <i class="fab fa-js"></i> [Code](https://github.com/Martin-Jung/Habitatmapping) | <i class="fas fa-globe"></i> [Online Viewer](https://uploads.users.earthengine.app/view/habitat-types-map) | <i class="fas fa-database"></i> [Data]( http://doi.org/10.5281/zenodo.4058819)

---
### Potential global habitat mapping

![Potential Habitats](https://zenodo.org/api/iiif/v2/1602b0da-c9ec-4c46-bad3-5cb20e634aa8:10f31a7c-9fdc-4b4b-a521-38b5bfe50220:screenshot.png/full/750,/0/default.png)
Potential global distribution, e.g. void of human influence, of habitat types following the IUCN habitat classification system at level 1. To create this layer data on the potential distribution of land cover was intersected with data on climate, elevation and topography. In total 12 classes are mapped based on the decision tree by [Jung et al. (2020)](https://doi.org/10.1038/s41597-020-00599-8), with the version number of this layer matching the version of the decision tree by Jung et al. Style file for use in QGIS are supplied.

<i class="fab fa-js"></i> [Code](https://github.com/Martin-Jung/Habitatmapping) | <i class="fas fa-database"></i> [Data](http://doi.org/10.5281/zenodo.4038749)

---
### Global forest fragmentation data

![Forest](https://martin-jung.github.io/GlobalForestFragmentation/images/header.JPG)

Newly created data on forest fragmentation using ALOS PALSAR data. Using the LecoS plugin I calculated on a global scale several landscape metrics at 0.1° resolution for the years 2007, 2008, 2009, 2010 and 2015. A manuscript describing the dataset was in preparation, however ultimately dropped due to changing priorities.
Includes data on the mean Forest Patch Area, Patch density, Edge density, Largest patch index, Landscape division index, Fractal dimension index, Average inner edge distance, and the Percentage of Like adjacencies

<i class="fab fa-python"></i> [Code](https://github.com/Martin-Jung/GlobalForestFragmentation/tree/master/Code) | <i class="fas fa-database"></i> [Data](https://martin-jung.github.io/GlobalForestFragmentation/)
___
