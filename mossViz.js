let svg = d3.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");
let nodeRadius = 10;
const filename = "Moss Results";
const filenum = 6;

let contain = (x, min, max) => Math.max(min, Math.min(max, x))

let get_first_name = (name) => {
  let names = name.split("_")
  switch (names[0]) {
    case "สำเนาของ": names.shift(); break;
    case "Copy": names.splice(0, 2); break;
  }
  return names[0]
}

let index_of = (pair, pairs) => {
  for (let i = 0; i < pairs.length; i++) {
    let ptext = pairs[i][0] + pairs[i][1]
    if (pair[0] + pair[1] === ptext || pair[1] + pair[0] === ptext) {
      return i
    }
  }
  return -1
}

let nodeSet = new Set();
let pairs = [];
// let sumWeight = 0;
// let maxWeight = -1;
let process_data = (data) => {
  let rows = data.querySelector("tbody").querySelectorAll("tr");

  for (let r = 0; r < rows.length; r++) {
    let columns = rows.item(r).querySelectorAll("td");
    if (columns.length > 0) {
      let pair = [];
      for (let c = 0; c < 2; c++) { // two assignment submissions
        let text = columns.item(c).querySelector("a").textContent;
        let nodeId = get_first_name(text) //text.substring(0, text.lastIndexOf(" "));

        nodeSet.add(nodeId);
        pair.push(nodeId);
      }

      let idx = index_of(pair, pairs)
      if (idx >= 0) {
        pairs[idx][2]++
      } else {
        pair.push(1);
        pairs.push(pair);
      }
      // let weight = +columns.item(2).textContent; // matched lines
      // sumWeight += weight;
      // if (idx >= 0) {
      //   pairs[idx][2] += weight
      //   maxWeight = Math.max(maxWeight, pairs[idx][2]);
      // } else {
      //   pair.push(weight);
      //   pairs.push(pair);
      //   maxWeight = Math.max(maxWeight, weight);
      // }
    }
  }
}

Promise.all(
  [...Array(filenum).keys()].map(idx => d3.html(`${filename}${idx+1}.html`))
).then((data) => {
  for (const datum of data) {
    process_data(datum)
  }

  let nodeArray = [...nodeSet];
  let nodes = [];
  nodeArray = nodeArray.map(node => {
    nodes.push({ name: get_first_name(node), full_name: node });
    return node;
  });

  let links = [];
  for (let pair of pairs) {
    if (pair[2] > 2) {
      links.push({
        source: nodeArray.indexOf(pair[0]),
        target: nodeArray.indexOf(pair[1]),
        weight: pair[2]/filenum
      });
    }
    // if (pair[2] > sumWeight/pairs.length) {
    //   links.push({
    //     source: nodeArray.indexOf(pair[0]),
    //     target: nodeArray.indexOf(pair[1]),
    //     weight: pair[2]/maxWeight
    //   });
    // }
  }
  
  let simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).distance(d => (1.5-d.weight)*width/nodeRadius))
    .force("charge", d3.forceManyBody().strength(-20 * links.length / nodes.length))
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
        if (!event.active) simulation.alphaTarget(0.1).restart();
      }));

  node.append("text")
    .attr("dy", "-1em")
    .text(d => d.name)
  node.append("title")
    .text(d => d.full_name)
})
