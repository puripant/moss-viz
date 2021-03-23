let svg = d3.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");
let nodeRadius = 10;
let mossUrl = "Moss Results.html";

let contain = (x, min, max) => Math.max(min, Math.min(max, x))

d3.html(mossUrl).then((data, error) => {
	if (error) throw error;

	let rows = data.querySelector("tbody").querySelectorAll("tr");

	let nodeSet = new Set();
	let pairs = [];
	let maxWeight = -1;
	let sumWeight = 0;
	for (let r = 0; r < rows.length; r++) {
		let columns = rows.item(r).querySelectorAll("td");
		if (columns.length > 0) {
			let pair = [];
			for (let c = 0; c < 2; c++) { // two student ids
				let text = columns.item(c).querySelector("a").textContent;
				let nodeId = text.substring(0, text.lastIndexOf(" "));

				//TODO use percentage for link weight (but the percentages of two nodes are not necessary the same).

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

	let nodeArray = [...nodeSet];
	nodes = [];
	nodeArray = nodeArray.map(node => {
		nodes.push({name: node});
		return node;
  });

	let links = [];
	for (let pair of pairs) {
		if (pair[2] > sumWeight/pairs.length) {
			links.push({
				source: nodeArray.indexOf(pair[0]),
				target: nodeArray.indexOf(pair[1]),
				weight: pair[2]/maxWeight
			});
		}
	}

	// let force = d3.layout.force()
	// 	// .gravity(.05)
	// 	.distance()
	// 	.charge() 
	// 	.size([width, height])
	// 	.nodes(nodes)
	// 	.links(links)
	// 	.on("tick", ticked)
	// 	.start();
  let simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).distance(d =>  (1-d.weight)*width/nodeRadius))
    .force("charge", d3.forceManyBody().strength(-1000/nodes.length)) //NOTE should be inversely proportional to #students/submissions
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${contain(d.x, nodeRadius, width - nodeRadius)},` +
                                  `${contain(d.y, nodeRadius, height - nodeRadius)})`);
      // node
      //     .attr("cx", d => d.x)
      //     .attr("cy", d => d.y);
    });

	let link = svg.append("g")
  		.attr("class", "links")
		.selectAll("line")
		.data(links)
	    .enter().append("line")
			.style("stroke-width", d => nodeRadius*d.weight);
			// .style("stroke-opacity", d => d.weight);

	let node = svg.append("g")
  		.attr("class", "nodes")
  	.selectAll("circle")
		.data(nodes)
	    .enter().append("g")

  node.append("circle")
    // .style("display", d => (d.weight === 0)? "none" : "unset")
		.attr("r", nodeRadius)
		// .call(force.drag);
		.call(d3.drag()
      .on("start", event => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", event => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }));

	node.append("text")
    .attr("dy", "-1em")
    // .style("display", d => (d.weight === 0)? "none" : "unset")
		.text(d => d.name);

	// function ticked() {
	// 	node.attr("transform", d => `translate(${Math.max(2*nodeRadius, Math.min(width  - 2*nodeRadius, d.x))},${Math.max(2*nodeRadius, Math.min(height - 2*nodeRadius, d.y))})`);

	// 	link
	//     .attr("x1", d => d.source.x)
	//     .attr("y1", d => d.source.y)
	//     .attr("x2", d => d.target.x)
	//     .attr("y2", d => d.target.y);
	// }

	// function dragstarted(d) {
	// 	force.stop()
	// }

	// function dragged(d) {
	// 	d.px += d3.event.dx;
  //   d.py += d3.event.dy;
  //   d.x += d3.event.dx;
  //   d.y += d3.event.dy;
  //   ticked();
	// }

	// function dragended(d) {
	// 	d.fixed = true;
	// 	ticked();
	// 	force.resume();
	// }
})