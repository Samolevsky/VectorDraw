// Create a wave pattern
var rows = 10;
var cols = 20;
var spacing = 30;
var amplitude = 15;

for(var i=0; i<rows; i++) {
	for(var j=0; j<cols; j++) {
		var x = j * spacing;
		var y = i * spacing + Math.sin(j * 0.5) * amplitude;
		var circle = new Path.Circle(new Point(x, y), 8);
		circle.fillColor = new Color(j / cols, i / rows, 0.7);
	}
}
