+++
title = "Introduction to Google Earth Engine"
date = 2018-07-22
draft = false

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ['gis','cloud-computing','google-earth-engine','google-cloud','remote-sensing']
categories = ['cloud-computing']

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
[image]
  # Caption (optional)
  caption = "Processing and analysing remote-sensing data in the cloud"

  # Focal point (optional)
  # Options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
  focal_point = "Left"

+++

In a previous post, I gave a brief introduction how to use [google cloud compute]({{< ref "/post/2018_DataScienceInGoogleCloud">}}) to kickstart your cloud computing experience. While it is possible to run large spatial operations on google cloud compute, it is quite time-consuming to set up all the routines to load and process geospatial data. Luckily there is now a new platform (currently in beta-testing) called Google Earth Engine (GEE) described as [planetary scale platform for spatial analyses](https://earthengine.google.com/).
\
<br>
GEE is (currently) free to use and users can sign up for a [beta-testing](https://earthengine.google.com/signup/). There are a [wide range of datasets](https://earthengine.google.com/datasets/) already available within GEE, including all available Landsat, Sentinel and MODIS satellite data. GEE furthermore allows to pre-process these layers and the fantastatic google team also already pre-computed layers such as cloud masks or ingested fully radiometrically corrected layers. If the reader is interested in what is possible with GEE, have a look at the [case studies](https://earthengine.google.com/case_studies/) on the GEE website.
\
<hr>
In the rest of this post I will showcase some exemplary scripts I coded in **Javascript** which, besides **python**, is the primary way to access and pre-process data in GEE. I will mostly only comment on my script as there are extensive tutorials, videos and detailed API descriptions [available](https://developers.google.com/earth-engine/) for GEE.
\
Whenever I load outside data (such as ESRI shapefiles) into GEE, I usually convert them to a KML file and then load them as Google Fusion Table (search online how to do this). All the (java-)scripts below can be pasted into the [GEE code console](https://code.earthengine.google.com), but if any errors occur then usually because of missing permissions (you might not be able to access my Google Fusion Tables).
\

The following script quantifies the date of forest loss from the [Hansen forest cover dataset](https://earthenginepartners.appspot.com/science-2013-global-forest/download_v1.5.html)

```javascript
// Load the global Hansen forest dataset
var gfcImage = ee.Image("UMD/hansen/global_forest_change_2017_v1_5");
/*
@author Martin Jung - m.jung@sussex.ac.uk
Idea:
Get average date of forest loss within sampling extent
*/

// Coordinates and parameters
// (This is a fusiontable id containing my polygon shapefile)
var fullsites = ee.FeatureCollection('ft:1Oet2yGWvldNoVx8A6ZlCi75Ks_lrEG0dG9oD6k2j'); // All sites

//////// Other Parameters //////////
var export_geometry = false; // export the geometry in the csv
var scale = 30; // Resolution over which image collection should be reduced, 30 m = native scale
var reduce = ee.Reducer.mean() // Reducer for image collection
// Also available max(), mean(), median(), min(), mode(), or(), product(), sum(), stdDev()
var what = "ForestLoss"; // Export name

// ################################################################### //
//                Function and main CODE starts here                   //
// ################################################################### //

// Create TimeBand
function createTimeBand(image) {
  return image.addBands(image.metadata('system:time_start'));
}

// ---- //
// Select the band with loss year
var forestImage = gfcImage.select(['lossyear']);
// Mask out pixels with no lossyear
var m = forestImage.gt(0);
forestImage = forestImage.mask(m);

// -------------------------------- //
// Reduce per polygon per polygon
var extracted = forestImage.reduceRegions(fullsites, reduce, scale);

Export.table.toDrive({
  collection: extracted.select([".*"], null, export_geometry),
  description: "PREDICTSHansen_"+what,
  fileNamePrefix: "PREDICTSHansen_"+what,
  fileFormat: 'geoJSON'
});
```
<br>
Not too difficult, right?
\
Here is another script that calculates a 95 % percentile composite of three months of EVI data calculated from all available Landsat surface reflectance images from 1984 to 2017. My script furthermore exclude all pixels that are clearly covered by water (using data from [Pekel et al. 2016](https://www.nature.com/articles/nature20584) ) and mask out unsuitable images (too many clouds) as well as clouds and cloud-shadows. Finally the mean, composited EVI within a buffer was exported.
Full script below:
<br>

```javascript
// Images and shapefiles
// Including landsat Level 1 land-surface-reflectance bands
var l8_led = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR"),
    l4_led = ee.ImageCollection("LANDSAT/LT04/C01/T1_SR"),
    l5_led = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR"),
    l7_led = ee.ImageCollection("LANDSAT/LE07/C01/T1_SR"),
    gsw = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"), // Global Surface water dataset
    usgadm = ee.FeatureCollection("ft:1kA8n0e3lvUVuWJSixVf5WaPyeqskp8kZg9zU9TBX"),
    bbs_union = ee.FeatureCollection("ft:1hqCRJam4b3niJZgRmJkOOMEe_qTwM77gZ-TyP4pe"), // Shapefiles I use my analyses. They contain polygons
    bbs = ee.FeatureCollection("ft:1gUxInqbJAG-kcH6bn6PioNnZ6G7fZOBIIaEADnIO");
/*
author: Martin Jung - 2018 (m.jung@sussex.ac.uk)
Idea:
Calculate avg overall EVI for all routes.
*/
// Parameters
var scale = 30; // Resolution over which image collection should be reduced, 30m = native scale
var precision = 10000; // Rounding precision
var cloudlimit = 80; // Should images with that many clouds be kept ? In order to reduce effect on non-filtered shades
var reduce = ee.Reducer.percentile([95]) ; // How should composites be reduced?
var startmonth = 3; // start Month when to use images from
var endmonth = 6; // end month
var startday = 20; // start day
var endday = 20; // end day
var fname = "EVIstack"; // FileNamedDescription
var what = 'evi'; // Name of resulting spectral index band

// Expressions
var f_evi = '2.5 * ((nir - red) / (nir + 2.4 * red + 1))'; // EVI2 formula (two-band version)

// ################################################################### //
//                Function and main CODE starts here                   //
// ################################################################### //

// Function to mask excess EVI values defined as > 1 and < 0
var maskExcess = function(image) {
    var hi = image.lte(1);
    var lo = image.gte(0);
    var masked = image.mask(hi.and(lo));
    return image.mask(masked);
  };

// Function to remove clouds - expects the new SR data to have a cfmask layer
// 126122017 - Adapted to work with LT1
var maskclouds = function(scene) {
  // The "pixel_qa" band has various flags encoded in
  // different bits.  We extract some of them as individual mask bands.
  // Note: Cloud masking information is present in "pixel_qa"
  // pixel_qa Bit 1: Clear pixel indicator.
  // pixel_qa Bit 2: Water indicator.
  // pixel_qa Bit 3: Cloud shadow indicator.
  // pixel_qa Bit 5: Cloud indicator.
  // pixel_qa Bits 6-7: Cloud confidence.
  // Fill = https://explorer.earthengine.google.com/#detail/LANDSAT%2FLE07%2FC01%2FT1_SR
  var clear = scene.select('pixel_qa').bitwiseAnd(2).neq(0);
  clear = scene.updateMask(clear);
  return(clear);
};

// Water mask all pixels with over 90 % water occurence
var water_mask = gsw.select('occurrence').gt(90).unmask(0);
var watermask = function(image){
  var masked = water_mask.eq(0);
  return image.mask(masked);
};

// Create TimeBand
function createTimeBand(image) {
  return image.addBands(image.metadata('system:time_start'));
}

// Filter out those bands with no images and create and empty image where there is none
// (This function should not be necessary as the area I investigate has full availability of Landsat 4-8)
var conditional = function(image) {
  return ee.Algorithms.If(ee.Number(image.get('num_elements')).gt(0),
                          image,
                          ee.Image(0).toDouble()
                          .set('system:time_start',image.get('system:time_start'))
                          .rename(what));
};

// VegIndex calculator. Calculate the EVI index (two-band versiob)
function calcIndex(image){
  var evi = image.expression(
      f_evi,
        {
          red: image.select('red').multiply(0.0001),    // 620-670nm, RED
          nir: image.select('nir').multiply(0.0001)    // 841-876nm, NIR
        });
    // Rename that band to something appropriate
    var dimage = ee.Date(ee.Number(image.get('system:time_start'))).format();
    return evi.select([0], [what]).set({'datef': dimage,'system:time_start': ee.Number(image.get('system:time_start'))});
}

// ----------------------------------------- //
// Further PROCESSING CODE STARTS BELOW              //
// ----------------------------------------- //

// Load the polygon shapefiles for my analysis and use a bounding box to clip all outputs
var bbs_filter = bbs_union;
var bbox = bbs_filter.geometry().bounds();
Map.addLayer(bbs_filter);Map.addLayer(bbox) // Add to map and center to it


  // Filter the layers and set bounds
  // get the LC8 collection
  var L8 = l8_led
     .filterBounds(bbox) // filter all Landsat images by bound
     .filterDate(ee.Date.fromYMD(1984,startmonth,startday), ee.Date.fromYMD(2017,endmonth,endday)) // Filter to up to latest sampling
     .filterMetadata('CLOUD_COVER_LAND','less_than',cloudlimit) // Ignore images with too many clouds
     .map(maskclouds) // mask clouds and cloud-shadows from the image
     .map(watermask) // mask out water
     .map(createTimeBand); // add a time band

  // get the LE7 collection
  var L7 = l7_led
     .filterBounds(bbox)
     .filterDate(ee.Date.fromYMD(1984,startmonth,startday), ee.Date.fromYMD(2017,endmonth,endday)) // Filter to up to latest sampling
     .filterMetadata('CLOUD_COVER_LAND','less_than',cloudlimit)
     .map(maskclouds)
     .map(watermask)
     .map(createTimeBand);

  // get the LE5 collection
  var L5 = l5_led
     .filterBounds(bbox)
     .filterDate(ee.Date.fromYMD(1984,startmonth,startday), ee.Date.fromYMD(2017,endmonth,endday)) // Filter to up to latest sampling
     .filterMetadata('CLOUD_COVER_LAND','less_than',cloudlimit)
     .map(maskclouds)
     .map(watermask)
     .map(createTimeBand);

  // get the LE5 collection
  var L4 = l4_led
     .filterBounds(bbox)
     .filterDate(ee.Date.fromYMD(1984,startmonth,startday), ee.Date.fromYMD(2017,endmonth,endday)) // Filter to up to latest sampling
     .filterMetadata('CLOUD_COVER_LAND','less_than',cloudlimit)
     .map(maskclouds)
     .map(watermask)
     .map(createTimeBand);

  // Rename bands for all (note that band number change between Landsat satellites)
  var L4 = L4.map(function(image){
    return image.select(
      ['B1','B2','B3','B4','B5','B7'],
      ['blue','green','red','nir','swir1','swir2']
      );
  });
  var L5 = L5.map(function(image){
    return image.select(
      ['B1','B2','B3','B4','B5','B7'],
      ['blue','green','red','nir','swir1','swir2']
      );
  });
  var L7 = L7.map(function(image){
    return image.select(
      ['B1','B2','B3','B4','B5','B7'],
      ['blue','green','red','nir','swir1','swir2']
      );
  });
  var L8 = L8.map(function(image){
    return image.select(
      ['B2','B3','B4','B5','B6','B7'],
      ['blue','green','red','nir','swir1','swir2']
      );
  });

  // Merge the collections
  // this collection is sorted by time
  var Collection = ee.ImageCollection(L8.merge(L7))
                        .sort('system:time_start',true);
  Collection = ee.ImageCollection(Collection.merge(L5))
                        .sort('system:time_start',true);
  Collection = ee.ImageCollection(Collection.merge(L4))
                        .sort('system:time_start',true);

  // Calculate an vegetation index on full collection
  Collection = Collection.map( calcIndex );
  // --------------------------------------------------- //
  // Mask out pixels with excess values (sensor errors)
  Collection = Collection.map( maskExcess );

  // Clip to feature collection geometry
  Collection = Collection.map(function(i){return i.clip(bbs_filter);});    

  // Reduce the time series of images into a single image
  var img = Collection.reduce(reduce);
  // --------------------------------- //

  // Run function to calculate the mean per polygon
  var extract = function(img,bbs){
    var extracted = img.reduceRegions(bbs, ee.Reducer.mean(), scale);
    return extracted;
  };

  // The extracted results
  var results = extract(img, bbs);

  // Export the output
  Export.table.toDrive({
      collection: results,
      folder: 'CropscapeTest', // Folder name in google drive
      description: 'Annual_' + fname + "_AvgEVI" + '_'+fname,
      fileNamePrefix : 'Annual_' + fname + "_AvgEVI" + '_'+fname,
      fileFormat: 'geoJSON'
  });

```

Hope these examples were helpful. I might post more of my code-examples at a later point.

Cheers, \
Martin
