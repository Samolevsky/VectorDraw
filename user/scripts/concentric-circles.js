// Create concentric circles with alternating colors
var center = view.center;
var numCircles = 15;
var radiusStep = 20;

for(var i=numCircles; i>0; i--) {
	var circle = new Path.Circle(center, i * radiusStep);
	circle.fillColor = i % 2 === 0 ? 'black' : 'white';
	circle.strokeColor = 'black';
	circle.strokeWidth = 2;
}
