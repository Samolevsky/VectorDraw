// Create a spiral of circles
var center = view.center;
var numCircles = 50;
var angleStep = 137.5; // Golden angle for nice distribution
var radiusStep = 3;

for(var i=0; i<numCircles; i++) {
	var angle = i * angleStep * (Math.PI / 180);
	var radius = i * radiusStep;
	var x = center.x + radius * Math.cos(angle);
	var y = center.y + radius * Math.sin(angle);
	
	var circle = new Path.Circle(new Point(x, y), 5 + i * 0.2);
	circle.fillColor = new Color(i / numCircles, 0.5, 1 - i / numCircles);
}
