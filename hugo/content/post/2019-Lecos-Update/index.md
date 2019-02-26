+++
title = "LecoS ported to QGIS3"
date = 2019-02-26T22:33:06Z
draft = false

# Authors. Comma separated list, e.g. `["Bob Smith", "David Jones"]`.
authors = []

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ['QGIS','LecoS','Landscape-Ecology']
categories = ['python','gis']

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["deep-learning"]` references
#   `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
# projects = ["internal-project"]

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
[image]
  # Caption (optional)
  caption = ""

  # Focal point (optional)
  # Options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
  focal_point = ""
+++

QGIS remains my go-to default QGIS software and I have contributed some python plugins to it in the past. These include the [LecoS](https://www.sciencedirect.com/science/article/pii/S1574954115001879) plugin, which has been cited __22__ times so far and still appears to be widely used by researchers and practitioner alike [I do remember helping out with a workshop in Nairobi quite a while back, where everybody appeared to know the plugin].

{{<figure src="lecos_screen.png" >}}

However because of other commitments (writing up my PhD thesis at the moment) I am unable to further develop this neat little piece of software. Furthermore I programmed LecoS mainly for my own use in the past, while these days I would probably use the excellent and comprehensive [landscapemetrics](https://r-spatialecology.github.io/landscapemetrics/) R-package. Nevertheless LecoS might still be useful for those people without coding knowledge and unwilling to apply a separate piece of software (Fragstats).

I can now announce that LecoS has finally been ported to QGIS 3. This can almost entirely be credited to [Caio Hamamura](https://github.com/caiohamamura), who led the code restructuring from QGIS2 to QGIS3. The new LecoS version 3.0 for QGIS3 should already be available from the QGIS plugin server. Thanks Caio!
