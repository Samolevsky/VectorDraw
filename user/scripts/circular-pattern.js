// Create a circular pattern of shapes
var center = view.center;
var numShapes = 12;
var radius = 150;

for(var i=0; i<numShapes; i++) {
	var angle = (i / numShapes) * Math.PI * 2;
	var x = center.x + Math.cos(angle) * radius;
	var y = center.y + Math.sin(angle) * radius;
	
	var rect = new Path.Rectangle(new Point(x - 15, y - 15), new Size(30, 30));
	rect.fillColor = new Color(i / numShapes, 0.7, 0.9);
	rect.rotate(angle * 180 / Math.PI, new Point(x, y));
}
