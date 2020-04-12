let svg = d3.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");
let nodeRadius = 10;

// Get URL paramters
const url = window.location.search;
const queryStringRegEx = query => new RegExp("[?|&]" + query + "=([^&]*)");
let matches = url.match(queryStringRegEx("id"));
const id = matches ? matches[1] : undefined;
let mossUrl = id? ("Moss Results" + id + ".html") : "Moss Results.html";
// let mossUrl = id? ("http://moss.stanford.edu/results/" + id) : "Moss Results3.html";
// let mossUrl = "Moss Results.html";

const unwantedChars = ["/"];

d3.html(mossUrl, (error, data) => {
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

				unwantedChars.forEach(c => {
					nodeId = nodeId.replace(new RegExp(c, 'g'), "");
				});

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
	let commonPrefixLen = longestCommonPrefixLength(nodeArray);
	nodes = [];
	nodeArray = nodeArray.map(node => {
		let shortNode = node.substring(commonPrefixLen);
		nodes.push({name: shortNode});
		return shortNode;
  });

	let links = [];
	for (let pair of pairs) {
		if (pair[2] > sumWeight/pairs.length) {
			links.push({
				source: nodeArray.indexOf(pair[0].substring(commonPrefixLen)),
				target: nodeArray.indexOf(pair[1].substring(commonPrefixLen)),
				weight: pair[2]/maxWeight
			});
		}
	}

	let force = d3.layout.force()
		// .gravity(.05)
		.distance(d =>  (1-d.weight)*width/nodeRadius)
		.charge(-10000/nodes.length) //NOTE should be inversely proportional to #students/submissions
		.size([width, height])
		.nodes(nodes)
		.links(links)
		.on("tick", ticked)
		.start();

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
		.call(d3.behavior.drag()
			.on("dragstart", dragstarted)
			.on("drag", dragged)
			.on("dragend", dragended));

	node.append("text")
    .attr("dy", "-1em")
    // .style("display", d => (d.weight === 0)? "none" : "unset")
		.text(d => d.name);

	function ticked() {
		node.attr("transform", d => `translate(${Math.max(2*nodeRadius, Math.min(width  - 2*nodeRadius, d.x))},${Math.max(2*nodeRadius, Math.min(height - 2*nodeRadius, d.y))})`);

		link
	    .attr("x1", d => d.source.x)
	    .attr("y1", d => d.source.y)
	    .attr("x2", d => d.target.x)
	    .attr("y2", d => d.target.y);
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
		// // Automatic prefix truncation by finding common starting substring https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
		// nodeArray.sort();
		// let i = 0;
		// while(i < nodeArray[0].length && nodeArray[0].charAt(i) === nodeArray[nodes.length-1].charAt(i)) {
		// 	i++;
		// }

    if (texts.length == 0) {
      return 0;
    }

		let maxLen = texts[0].length;
    for (let len = 0; len < maxLen; len++) {
      let currentChar = texts[0].charAt(len);
      for (let j = 1; j < texts.length; j++) {
        if (len >= texts[j].length || texts[j].charAt(len) != currentChar) { //mismatch
          return len;
        }
      }
    }
    return maxLen;
	}
});
