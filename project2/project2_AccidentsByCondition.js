function plotAccbyCond()
{

console.log('inside plot accidents by condition');

d3.select("input[value=\"primaryfactor\"]").property("checked", true);

var width = 550,
    height = 300,
	radius = Math.min(width, height) / 2;
	
var margin = 10;

var svg = d3.select(".pieChart")
	.append("svg")
	.attr("width", width)
    .attr("height", height)
	.append("g");
	
svg.append("g")
	.attr("class", "slices");
svg.append("g")
	.attr("class", "labelName");
svg.append("g")
	.attr("class", "labelValue");
svg.append("g")
	.attr("class", "lines");

var pie = d3.layout.pie()
	.sort(null)
	.value(function(d) {
		return d.NoOfAccidents;
	});

var arc = d3.svg.arc()
	.outerRadius(radius * 0.8)
	.innerRadius(radius * 0.6)
	.cornerRadius(5) 
    .padAngle(0.016);

var outerArc = d3.svg.arc()
	.innerRadius(radius * 0.9)
	.outerRadius(radius * 0.9);

var div = d3.select(".pieChart").append("div").attr("class", "toolTip");

svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var colorRange = d3.scale.category20();
var color = d3.scale.ordinal()
	.range(colorRange.range());

d3.csv('data/primaryfactors.csv', function(error, data) {
        change(data);
    });

d3.selectAll("input")
	.on("change", selectDataset);
	
function selectDataset()
{
	var value = this.value;
	if (value == "weather")
	{
		d3.csv('data/weatherconditions.csv', function(error, data) {
        change(data);
    });
	}
   if (value == "light")
	{
		d3.csv('data/lightconditions.csv', function(error, data) {
        change(data);
    });
	}
	if (value == "primaryfactor")
	{
		d3.csv('data/primaryfactors.csv', function(error, data) {
        change(data);
    });
	}
	if (value == "surface")
	{
		d3.csv('data/surfacetypes.csv', function(error, data) {
        change(data);
    });
	}
	
}

function change(data) {

	var slice = svg.select(".slices").selectAll("path.slice")
        .data(pie(data), function(d){ return d.data.Condition });

    slice.enter()
        .insert("path")
        .style("fill", function(d) { return color(d.data.Condition); })
        .attr("class", "slice");

    slice
        .transition().duration(1000)
        .attrTween("d", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                return arc(interpolate(t));
            };
        })
		
    slice.exit()
        .remove();
		
		// add tooltip to mouse events
            d3.selectAll('.labelName text, .slices path').call(toolTip);
       
            // calculates the angle
            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

            // function that creates and adds the tool tip to a selected element
            function toolTip(selection) {

                // add tooltip
                selection.on('mouseover', function (d) {

                    svg.append('text')
                        .attr('class', 'toolCircle')
                        .attr('dy', -15) 
                        .html(toolTipHTML(d)) 
                        .style('font-size', '.8em')
                        .style('text-anchor', 'middle');

                    svg.append('circle')
                        .attr('class', 'toolCircle')
                        .attr('r', radius * 0.55)
                        .style('fill', color(d.data.Condition))
                        .style('fill-opacity', 0.35);
                });
				
				//mouseout
                selection.on('mouseout', function () {
                    d3.selectAll('.toolCircle').remove();
                });
            }
			
            //tool tip function
            function toolTipHTML(data) {

                var tip = '',
                    i   = 0;
					
				var f = d3.format(".1f");

                for (var key in data.data) {

                    var value = (!isNaN(parseFloat(data.data[key]))) ? data.data[key] : data.data[key];

                    if (i === 0) tip += value + '</tspan>';
                    //else tip += '<tspan x="0" dy="1.2em">' + 'No of Accidents' + ': ' + value + '</tspan>';
					else tip += '<tspan x="0" dy="1.2em">' + f((value)*(100/73414))+"%"  + '</tspan>' + '<tspan x="0" dy="1.2em">'+value;
                    i++;
                }

                return tip;
            }
			
			    // text labels
    
    var text = svg.select(".labelName").selectAll("text")
        .data(pie(data), function(d){ return d.data.Condition });

    text.enter()
        .append("text")
        .attr("dy", ".35em")
		.style('font-size', '.8em')
        .style('text-anchor', 'middle')
	    .style('font-style','italic')

    function midAngle(d){
        return d.startAngle + (d.endAngle - d.startAngle)/2;
    }

    text
        .transition().duration(1000)
        .attrTween("transform", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
            };
        })
        .styleTween("text-anchor", function(d){
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                return midAngle(d2) < Math.PI ? "start":"end";
            };
        })
        .text(function(d) {
		    var f = d3.format(".1f");
            return (d.data.Condition);
        });


    text.exit()
        .remove();

    // Text on polylines

    var polyline = svg.select(".lines").selectAll("polyline")
        .data(pie(data), function(d){ return d.data.Condition });

    polyline.enter()
        .append("polyline");

    polyline.transition().duration(1000)
        .attrTween("points", function(d){
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [arc.centroid(d2), outerArc.centroid(d2), pos];
            };
        });

    polyline.exit()
        .remove();
		
	
		
};
}
plotAccbyCond();