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
			for (let c = 0; c < 2; c++) { // two assignment submissions
				let text = columns.item(c).querySelector("a").textContent;
				let nodeId = text.substring(0, text.lastIndexOf(" "));

				nodeSet.add(nodeId);
				pair.push(nodeId);
			}

			let weight = +columns.item(2).textContent; // matched lines
			maxWeight = Math.max(maxWeight, weight);
			sumWeight += weight;
			pair.push(weight);
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

  let simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).distance(d => (1.5-d.weight)*width/nodeRadius))
    .force("charge", d3.forceManyBody().strength(-1000/nodes.length))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${contain(d.x, nodeRadius, width  - nodeRadius)},` +
                                            `${contain(d.y, nodeRadius, height - nodeRadius)})`);
    });

	let link = svg.append("g")
  		.attr("class", "links")
		.selectAll("line")
		.data(links)
	    .enter().append("line")
			.style("stroke-width", d => nodeRadius*d.weight);

	let node = svg.append("g")
  		.attr("class", "nodes")
  	.selectAll("circle")
		.data(nodes)
	    .enter().append("g")

  node.append("circle")
		.attr("r", nodeRadius)
		.call(d3.drag()
      .on("drag", event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", event => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
      }));

	node.append("text")
    .attr("dy", "-1em")
		.text(d => d.name);
})