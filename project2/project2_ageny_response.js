
function buid_scatter_plot()
{
	
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 300 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category20();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("#scatterplot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Lasso functions to execute while lassoing
var lasso_start = function() {
  lasso.items()
    .attr("r",3.5)
    .style("fill",null)
    .classed({"not_possible":true,"selected":false});
};

var lasso_draw = function() {
  // Style the possible dots
  lasso.items().filter(function(d) {return d.possible===true})
    .classed({"not_possible":false,"possible":true});

  // Style the not possible dot
  lasso.items().filter(function(d) {return d.possible===false})
    .classed({"not_possible":true,"possible":false});
};

var lasso_end = function() {
  // Reset the color of all dots
  lasso.items()
     .style("fill", function(d) { return color(d.AGENCYORIDESCR); });

  // Style the selected dots
  var selected = lasso.items().filter(function(d) {return d.selected===true})
  
  var mySelectedArray = [];
  
  selected[0].forEach(function(d){
    mySelectedArray.push(d3.select(d).datum())
	});
	
	if (mySelectedArray.length > 0) {
	clearTableRows();
	mySelectedArray.forEach(d_row => populateTableRow(d_row))
    }
	else {
         clearTableRows();
    }
    selected.classed({"not_possible":false,"possible":false})
    .attr("r",9);

  // Reset the style of the not selected dots
  lasso.items().filter(function(d) {return d.selected===false})
    .classed({"not_possible":false,"possible":false})
    .attr("r",5.5);

};

function clearTableRows() {

            hideTableColNames();
            d3.selectAll(".row_data").remove();
        }
		
function hideTableColNames() {
            d3.select("table").style("visibility", "hidden");
        }
		
function showTableColNames() {
            d3.select("table").style("visibility", "visible");
        }

function populateTableRow(d_row) {

            showTableColNames();

            var d_row_filter = [d_row.COUNTYDESCR,d_row.AGENCYORIDESCR,d_row.COUNT_AGENCYORITXT,d_row.AVG_RESPONSETIME];

            d3.select("table")
              .append("tr")
              .attr("class", "row_data")
              .selectAll("td")
              .data(d_row_filter)
              .enter()
              .append("td")
              .attr("align", (d, i) => i == 0 ? "left" : "right")
              .text(d => d);
        }
		
		
// Create the area where the lasso event can be triggered
var lasso_area = svg.append("rect")
                      .attr("width",width)
                      .attr("height",height)
                      .style("opacity",0);

// Define the lasso
var lasso = d3.lasso()
      .closePathDistance(75) 
      .closePathSelect(true)
      .hoverSelect(true)
      .area(lasso_area)
      .on("start",lasso_start)
      .on("draw",lasso_draw)
      .on("end",lasso_end);
	  
// Init the lasso on the svg:g that contains the dots
svg.call(lasso);

d3.tsv("data/agency_response_count_avg.tsv", function(error, data) {
  data.forEach(function(d) {
  
    //Average response time
    d.AVG_RESPONSETIME = +d.AVG_RESPONSETIME;
	//Count
    d.COUNT_AGENCYORITXT = +d.COUNT_AGENCYORITXT;
  });

  x.domain(d3.extent(data, function(d) { return d.COUNT_AGENCYORITXT; })).nice();
  
  y.domain(d3.extent(data, function(d) { return d.AVG_RESPONSETIME; })).nice();
  
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("No.of Accidents reported in each PD");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Avg. Response Time(mins)")

  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("id",function(d,i) {return "dot_" + i;}) // added
      .attr("class", "dot")
      .attr("r", 5.5)
      .attr("cx", function(d) { return x(d.COUNT_AGENCYORITXT); })
      .attr("cy", function(d) { return y(d.AVG_RESPONSETIME); })
      .style("fill", function(d) { return color(d.AGENCYORIDESCR); })
	  .on('mouseover', function () {
        d3.select(this)
          .transition()
          .duration(500)
          .attr('r',20)
          .attr('stroke-width',3)
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(500)
          .attr('r',5.5)
          .attr('stroke-width',1)
      })
	  .on("click",function () {

  // Style the selected dots
  
  var mySelectedArray = [];
  
    mySelectedArray.push(d3.select(this).datum());
	
	if (mySelectedArray.length > 0) {
	clearTableRows();
	mySelectedArray.forEach(d_row => populateTableRow(d_row))
    }
	else {
         clearTableRows();
    }
	 
	  })
	  .append('title') // Tooltip
      .text(function (d) { return" Agency : "+d.AGENCYORIDESCR +'\n'+"Total Incidents Reported : "+d.COUNT_AGENCYORITXT +'\n'+"Average Response Time : "+d.AVG_RESPONSETIME+" min"+'\n'+"County : "+d.COUNTYDESCR; })
	  ;

  lasso.items(d3.selectAll(".dot"));
/*
  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
*/
});

}

buid_scatter_plot();