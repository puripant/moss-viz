# MossViz
Visualizing [Moss (Measure Of Software Similarity)](http://moss.stanford.edu) result in a node-link diagram

##How to Use
Just open up `index.html` to see the visualization. It will open an example data file `Moss Results.html` which can be saved directly from the website.

##Visualization
It is a standard node-link diagram implemented with [D3](https://d3js.org) (v3 for now). Each node is a submission path. An edge shows that two submissions are more similar than the average of the submission set (measured by the number of common lines and visualized as edge thickness).

Cliques of plagiarism should be easily detectable. Nodes can also be dragged around and fixed for manual layout.

##More to be Done
It will be nice if the tool can directly fetch the result from an URL. Sometimes the submission path is too long; a prefix or suffix trauncation will be useful. Advanced layout algorithms, at least a simple border collision, are welcome.