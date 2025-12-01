// Create overlapping circles with gradient colors
var numCircles = 20;
var maxRadius = 80;

for(var i=0; i<numCircles; i++) {
	var circle = new Path.Circle(
		new Point(
			Math.random() * view.size.width,
			Math.random() * view.size.height
		),
		20 + Math.random() * maxRadius
	);
	
	var hue = Math.random();
	circle.fillColor = new Color(hue, 0.8, 0.9);
	circle.opacity = 0.3;
	circle.strokeColor = new Color(hue, 1, 0.7);
	circle.strokeWidth = 2;
}
