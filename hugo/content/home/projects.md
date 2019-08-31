+++
# Projects widget.
widget = "projects"
active = false
date = "2016-04-20T00:00:00"

title = "Projects"
subtitle = "Some current and past projects where I was involved"

# Order that this section will appear in.
weight = 50

# Content.
# Display content from the following folder.
# For example, `folder = "project"` displays content from `content/project/`.
folder = "project"

# View.
# Customize how projects are displayed.
# Legend: 0 = list, 1 = cards. 2 = showcase large images
view = 1

# Filter toolbar.

# Default filter index (e.g. 0 corresponds to the first `[[filter]]` instance below).
filter_default = 0

# Add or remove as many filters (`[[filter]]` instances) as you like.
# Use "* " tag to show all projects or an existing tag prefixed with "." to filter by specific tag.
# To remove toolbar, delete/comment all instances of `[[filter]]` below.

[[filter]]
  name = "All"
  tag = "*"

[[filter]]
  name = "PhD"
  tag = ".js-id-phd-thesis"

[[filter]]
  name = "Research"
  tag = ".js-id-research"

[[filter]]
  name = "GIS"
  tag = ".js-id-gis"

[[filter]]
  name = "Coding"
  tag = ".js-id-coding"

[[filter]]
    name = "R"
    tag = ".js-id-rstats"

[[filter]]
    name = "Python"
    tag = ".js-id-python"
+++
