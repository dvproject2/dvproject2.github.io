
var map_width = 300,
    map_height = 400;

var logval = d3.scale.log().range([0,2]);
	
var quantize = d3.scale.quantize()
    .domain([0, 8])
    .range(d3.range(8).map(function(i) { return "q" + i + "-8"; }));

var projection = d3.geo.mercator()
     	.scale(1)
        .translate([0, 0]);
		
var path = d3.geo.path()
        .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", map_width)
    .attr("height", map_height);

tip = d3.tip()
  .attr('class', 'd3-tip')
  .html(function(d) {
	  	var county = all_datag.all().filter(function(data){ if(data.key == d.properties.NAME){ return data.value } })  ;
		var count = county[0].value;
	  	  
     return d.properties.NAME + "<br/>Accidents: "+ count 

   });
    
svg.call(tip);

   var legend = d3.select("#map-legend").
     append("svg:svg").
     attr("width", 160).
     attr("height", 10)
   for (var i = 0; i < 8; i++) {
     legend.append("svg:rect").
     attr("x", i*20).
     attr("height", 10).
     attr("width", 20).
     attr("class", "q" + i + "-8 ");//color
   };

var indCounties = [];
   
var cf = crossfilter(),
  all_data = cf.dimension(function(d) {return d.COUNTY;}, true)
  all_datag = all_data.group().reduceSum(function(d) {return +d.NUM_ACCIDENTS;}),
  per_hour = cf.dimension(function(d) { return d.COLLISION_TIME;}),
  per_hourg = per_hour.group().reduceSum(function(d) {return +d.NUM_ACCIDENTS;}),
  per_day = cf.dimension(function(d) { return d.WEEK_DAY_NUM;}),
  //per_day = cf.dimension(function(d) { return d.COLLDTE;}),
  per_dayg = per_day.group().reduceSum(function(d) {return +d.NUM_ACCIDENTS;});
  
  
queue()
	.defer(d3.json, "data/indiana.json")
    .defer(d3.csv, "data/Accidents_By_County_Week_Hour.csv", function(d){
	//  .defer(d3.csv, "data/Accidents_By_County_Day_Hour.csv", function(d){
	 for(var propertyName in d) {
        if (propertyName == "COUNTY") {
          continue;
        };
        d[propertyName] = +d[propertyName];
      }
      cf.add([d]);
	  indCounties.push(d.COUNTY);
	  
	})
    .await(buildViz);                 

					// Added from indiana map code
function buildViz(error, indiana) {
	if (error) throw error;

 // var b = path.bounds(topojson.feature(indiana, indiana.objects.cb_2015_indiana_county_20m)),
 //	  s = .95 / Math.max((b[1][0] - b[0][0]) / map_width, (b[1][1] - b[0][1]) / map_height),
 //	  t = [(map_width - s * (b[1][0] + b[0][0])) / 2, (map_height - s * (b[1][1] + b[0][1])) / 2];

  projection
           .scale(3300)
		   .translate([5075, 2680]);   // best position for map in the viz
	

	
   svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(indiana, indiana.objects.cb_2015_indiana_county_20m).features)
    .enter().append("path")
    .attr("class", function(data) { 
	    var county = all_datag.all().filter(function(d){ 
				if(d.key == data.properties.NAME)
					{ return d.value }
			//	else { return {key:data.properties.NAME, value:0}}

		})  ;
		var count = county[0].value;
		console.log(count, logval(count));
		return quantize(logval(count));    //count); 
	   })
      .attr("Name", function(data){return data.properties.NAME;})
      .attr("d", path)
      .on('mouseover',tip.show)
      .on('mouseout', tip.hide);

  var charts = [
      
    barChart(true)
      .dimension(per_hour)
      .group(per_hourg)
    .x(d3.scale.linear()
      .domain([0, 23])
      .range([0, 250])),

    barChart(true)
      .dimension(per_day)
      .group(per_dayg)
    .x(d3.scale.linear()       
      .domain([1, 7])
	//  .domain([1,31])
      .range([0, 250])),

 ]

  var chart = d3.selectAll(".chart")
    .data(charts)
    .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

  // barChart
  function barChart(incBar) {
    if (!barChart.id) barChart.id = 0;

    incBar = typeof incBar !== 'undefined' ? incBar : false;
    var formatAsNumber = d3.format(",d");
    
    var axis = d3.svg.axis().orient("bottom");

    if (incBar == true) {
      axis.tickFormat(formatAsNumber);
      
    }
    var margin = {top: 10, right: 10, bottom: 20, left: 10},
      x,									  
      y = d3.scale.linear().range([100, 0]),   
      id = barChart.id++,
      brush = d3.svg.brush(),
      brushDirty,
      dimension,
      group,
      round;

    function chart(svg) { 
      var width = x.range()[1],      
	  height = y.range()[0];			
    //  console.log(height);   //// gives max of each bar graph
      try {
        y.domain([0, group.top(1)[0].value]);  
        	
      }
      catch(err) {
        window.reset
      } 

      svg.each(function() {
        var svg = d3.select(this),
            g = svg.select("g");
	//		console.log(svg);

        // Create the skeletal chart.
        if (g.empty()) {
	//	console.log(id);
          svg.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");
			
	

          g = svg.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
                .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);
			  
          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
	//		console.log('inside brushDirty Flag');
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          svg.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var indCounties = brush.indCounties();
		//	console.log(indCounties);
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(indCounties[0]))
                .attr("width", x(indCounties[1]) - x(indCounties[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
	
        while (++i < n) {
          d = groups[i];
		//  console.log(d);
	//	  console.log(d.key, d.value);
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
		  
        }
        return path.join("");
      }
    
      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height/3 ;  // height/3
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
		    + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
	//	console.log('inside brush start');
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
		
	//	console.log('inside brush.chart');
      var g = d3.select(this.parentNode),
          indCounties = brush.extent();
		//  console.log(indCounties);
      if (round) g.select(".brush")
          .call(brush.indCounties(indCounties = indCounties.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(indCounties[0]))
          .attr("width", x(indCounties[1]) - x(indCounties[0]));

      var selected = crossfilter()
			selectedDim = selected.dimension(function(d) {return d.COUNTY ;}, true)

      dimension.filterRange(indCounties).top(Infinity).forEach(function(d) {
	//	  console.log(d);
        selected.add([d]);
		//console.log(d.COUNTY);
      });
      svg.attr("class", "counties")
        .selectAll("path")
          .attr("class", function(data) { //console.log(selectedDim.group().size());
								//console.log(selected.length);
							if ( selectedDim.group().size() >= 0) 
									{
							var county = selectedDim.group().all().filter(
									function(d)
										{ 
						//				console.log(data.properties.NAME);
										if(d.key == data.properties.NAME)
											{ 
						//				console.log(d.value);
										return d.value }
										})  ;
						//		console.log(county);
								var count = county[0].value;
					
								return quantize(logval(count));	
										} 
							else if (indCounties.indexOf(data.COUNTY) >= 0) 
									{
										//return "q3-7"
								} 
							else {return null;}});
		

    });

	

    brush.on("brushend.chart", function() {
	//	console.log('inside brushed.chart');
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
	//	console.log(id);
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.indCounties(_);
	//	console.log('hello');
        dimension.filterRange(_);
      } else {
	//	  console.log('hello else');
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }

  
  function call_val(nameval)
  {
	    
	    var county = all_datag.all().filter(function(d){ if(d.key == nameval){ return d.value } })  ;
		var count = county[0].value;
		return count; 	  
	  
  }
  
  
  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
	}

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
	}

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
	};

  window.reset = function(i) {
    charts.forEach(function (c) {
      c.filter(null);
    })
    renderAll();
    svg.attr("class", "counties")
      .selectAll("path")
        .attr("class", function(d) {  
	//	console.log('inside counties');
		var county = all_datag.all().filter(function(data){ if(data.key == d.properties.NAME){ return data.value } })  ;
		var count = county[0].value;
		return quantize(logval(count)); });
	};
	
  renderAll();
  
}
