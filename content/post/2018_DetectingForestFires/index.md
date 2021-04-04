+++
title = "Detecting fire events in remotely sensed time-series"
date = 2018-07-30
draft =  true

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ['gis','remote-sensing','change-detection','MODIS','fire','rstats']
categories = ['research','gis','remote-sensing']

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
[image]
  # Caption (optional)
  caption = "[Modified Copernicus Sentinel data (2016), processed by ESA](https://www.esa.int/spaceinimages/Images/2016/09/Fire-scarred_Madeira)"

  # Focal point (optional)
  # Options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
  focal_point = "Left"

+++

Natural and anthropogenic fires are important factors shaping the Earth's land-surface. While many ecosystems are directly dependent on recurring fire events, humans often are quite threathened by such events. Given that fire frequency is [increasing](http://ulmo.ucmerced.edu/pdffiles/16RSTB_Westerling.pdf), likely because of climate change, it is therefore quite important to improve our capability of predicting and detecting fire events. One way of doing this is by looking at time series of remote sensing and I got interested in fires in the past, mainly because they "should" be relatively easy to identify from space if they are big enough.

In this little demonstration
CALFIRE shapefiles and fire information data was obtained from the [Californian Department of Forestry and Fire Protection](http://frap.fire.ca.gov/data/frapgisdata-sw-fireperimeters_download). No modification of the original spatial data was done.
This is an analysis I conducted early in 2017 and therefore only fires up to 2016 are contained in this analysis. More updated fire information is available through CALFIRE.

I then extracted and calculated the average value

```R
for(b in seq(1:7)){
   myLog("       |- Band ",b)
   # Get band
   sub1 = sub %>% dplyr::filter(Band == b) %>% dplyr::select(value,date)

   # Construct zoo time series
   sub1 = zooreg(sub1$value,order.by = sub1$date)
   # Merge with ideal time series and use the merge product as new ts
   sub1 = merge(ideal,sub1,all = T)[,2]
   sub1.ori = sub1

   # Detect and remove outliers based on MAD defined threshold
   # http://eurekastatistics.com/using-the-median-absolute-deviation-to-find-outliers/
   if(outlier){
     x = abs(sub1 - median(sub1,na.rm = T)) / mad(sub1,na.rm = T)
     tr = ifelse(quantile(x,.99,na.rm=T)>2,quantile(x,.99,na.rm=T),NA) # Determine threshold
     if(!is.na(tr)){
       sub1[ which(x > tr )] <- NA
     }
   }

   # Next fill all gaps using a kalman smoother of state-space model
   sub1_i <- try(
     na.kalman(coredata(sub1),model = "auto.arima",smooth = TRUE),
     silent=T)

   # The time series of NDVI was smoothed using the Savitzky–Golay filter with a length of 5 to reduce noise
   # but still expose abrupt change events that might occur in the series (Jönsson & Eklundh, 2004)
   # Note this queries the signal package sgolayfilter function, which has other default parameters
   # that might defer from the default as set in the TIMESAT software
   sub1_i <- signal::sgolayfilt(sub1_i, n = 5)

   # Overwrite previous values
   coredata(sub1) <- sub1_i

   # Reset values
   #s.na <- na.approx(sub1.ori,maxgap=5)
   #sub1_i2 <- merge(sub1,s.na) # prev. cbind
   ## Equalize gaps where continious gap length too long
   #sub1_i2[which(is.na(apply(sub1_i2,1,mean))),1] <- NA
   #subi_1 <- sub1_i2[,1];rm(sub1_i2,s.na)

   # Save
   result[[id]][[paste0("Band",b)]] <- sub1

   rm(b,sub1,sub1_i)
 }
 B1 = result[[id]][["Band1"]]
 B2 = result[[id]][["Band2"]]
 B3 = result[[id]][["Band3"]]
 B4 = result[[id]][["Band4"]]
 B5 = result[[id]][["Band5"]]
 B6 = result[[id]][["Band6"]]
 B7 = result[[id]][["Band7"]]

 #NDVI
 # (2-1) / (2+1)
 result[[id]][["NDVI"]] <- (B2 - B1) / (B2 + B1)
 # EVI = G * (NIR – RED)/(NIR + C1*RED - C2*BLUE + L))
 #G – Gain factor
 #L – Factor for canopy background adjustment
 #C1, C2: Coefficients for correcting aerosol influences from RED using BLUE
 #MODIS EVI algorithm: L = 1, G = 2.5, C1 = 6, C2 = 7.5
 result[[id]][["EVI"]] = 2.5 * ((B2 - B1) / (B2 + 6.0 * B1 - 7.5 * B3 + 1.0))
 # EVI2
 # Using only two bands without blue
 result[[id]][["EVI2"]] = 2.5 * ((B2 - B1) / (B2 + B1 + 1))
 # SAVI
 # SAVI = (1 + L) * (NIR – RED)/(NIR + RED + L)
 result[[id]][["SAVI"]] = (1 + 0.5) * (B2 - B1) / (B2 + B1 + 0.5)
 # NDMI
 # Gao 1996 (NIR - Swir)
 result[[id]][["NDMI"]] = (B2 - B5) / (B2 + B5)
 # GVMI
 # Global Vegetation Moisture Index
 #( 5 + 0.1 ) - ( 7 + 0.02 ) ( 5 + 0.1 ) + ( 7 + 0.02 )
 result[[id]][["GVMI"]] = (B5 + 0.1) - (B7 + 0.02) / (B5 + 0.1) + (B7 + 0.02)
 # NBRI -  Normalised Burn Ratio Index
 # NDSWIR
 #  (nir - swir2)/(nir + swir2)
 result[[id]][["NBRI"]] = (B2 - B7) / (B2 + B7)
 # Heterogeneity
 # CV
 zz = try(merge(B1,B2,B3,B4,B5,B6,B7),silent = T)
 sh = try( zoo(apply(zz,1,co.var),time(zz)),silent = T)
 if( class(sh)[1]!="try-error") result[[id]][["CV"]] <- sh

 d <- list(NULL, c("brightness", "greenness", "wetness"))
 tass = matrix(c(
   #Lobser & Cohen (2007)
   0.4395, 0.5945, 0.2460, 0.3918, 0.3506, 0.2136, 0.2678,
   -0.4064, 0.5129,-0.2744,-0.2893, 0.4882,-0.0036,-0.4169,
   0.1147, 0.2489, 0.2408, 0.3132,-0.3122,-0.6416,-0.5087), ncol = 3, dimnames = d)
 # Calculate tasseled cap transformed values
 result[[id]][["Brightness"]] = tass[1,1]*B1+tass[2,1]*B2+tass[3,1]*B3+tass[4,1]*B4+tass[5,1]*B5+tass[6,1]*B6+tass[7,1]*B7
 result[[id]][["Greenness"]] = tass[1,2]*B1+tass[2,2]*B2+tass[3,2]*B3+tass[4,2]*B4+tass[5,2]*B5+tass[6,2]*B6+tass[7,2]*B7
 result[[id]][["Wetness"]] = tass[1,3]*B1+tass[2,3]*B2+tass[3,3]*B3+tass[4,3]*B4+tass[5,3]*B5+tass[6,3]*B6+tass[7,3]*B7

}
print("Done!")
saveRDS(result,paste0("Center_FullTimeSeriesSmooth_Final.rds"))

```
