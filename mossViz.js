var svg = d3.select("svg");
var width = +svg.attr("width");
var height = +svg.attr("height");

d3.html("Moss Results.html", function(error, data) {
	if (error) throw error;
	
	var rows = data.querySelector("tbody").querySelectorAll("tr");
	
	var nodeSet = new Set();
	var pairs = []
	var maxWeight = -1;
	var sumWeight = 0;
	for(var r = 0; r < rows.length; r++) {
		var columns = rows.item(r).querySelectorAll("td");
		if(columns.length > 0) {
			let pair = [];
			for(var c = 0; c < 2; c++) { // two student ids
				var text = columns.item(c).querySelector("a").textContent;
				var nodeId = text.substring(0, text.lastIndexOf(" "));
				nodeSet.add(nodeId);
				pair.push(nodeId);
			}
			
			let weight = +columns.item(2).textContent
			maxWeight = Math.max(maxWeight, weight);
			sumWeight += weight;
			pair.push(weight); // #common lines
			pairs.push(pair);
		}
	}
	var nodeArray = [...nodeSet];
	var commonPrefixLen = longestCommonPrefixLength(nodeArray);
	var nodes = [];
	for(let n of nodeSet) {
		nodes.push({name: n.substring(commonPrefixLen)});
	}
	
	var links = [];
	for(let pair of pairs) {
		if(pair[2] > sumWeight/pairs.length) {
			links.push({
				source: nodeArray.indexOf(pair[0]), 
				target: nodeArray.indexOf(pair[1]),
				weight: pair[2]/maxWeight
			});
		}
	}
	
	var force = d3.layout.force()
		// .gravity(.05)
		.distance(function(d) { return (1-d.weight)*width/10; })
		.charge(-1000)
		.size([width, height])
		.nodes(nodes)
		.links(links)
		.on("tick", ticked)
		.start();
	
	var link = svg.append("g")
  		.attr("class", "links")
		.selectAll("line")
		.data(links)
	    .enter().append("line")
			.style("stroke-width", function(d) { return 10*d.weight; });
			// .style("stroke-opacity", function(d) { return d.weight; });
	
	var node = svg.append("g")
  		.attr("class", "nodes")
  	.selectAll("circle")
		.data(nodes)
	    .enter().append("g")
		
	node.append("circle")
		.attr("r", 10)
		// .call(force.drag);
		.call(d3.behavior.drag()
			.on("dragstart", dragstarted)
			.on("drag", dragged)
			.on("dragend", dragended));

	node.append("text")
		.attr("dy", "-1em")
		.text(function(d) { return d.name; });
	
	function ticked() {
		link
	    .attr("x1", function(d) { return d.source.x; })
	    .attr("y1", function(d) { return d.source.y; })
	    .attr("x2", function(d) { return d.target.x; })
	    .attr("y2", function(d) { return d.target.y; });

		node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}

	function dragstarted(d) {
		force.stop()
	}

	function dragged(d) {
		d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy; 
    ticked();
	}

	function dragended(d) {
		d.fixed = true;
		ticked();
		force.resume();
	}
	
	function longestCommonPrefixLength(texts) {
    if(texts.length == 0) {
      return 0;
    }

		var maxLen = texts[0].length;
    for(var len = 0; len < maxLen; len++) {
      var currentChar = texts[0].charAt(len);
      for (var j = 1; j < texts.length; j++) {
        if(len >= texts[j].length || texts[j].charAt(len) != currentChar) { //mismatch
          return len;
        }
      }
    }
    return maxLen;
	}
});