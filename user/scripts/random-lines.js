// Create random connecting lines
var numLines = 40;
var colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

for(var i=0; i<numLines; i++) {
	var path = new Path();
	path.strokeColor = colors[Math.floor(Math.random() * colors.length)];
	path.strokeWidth = 1 + Math.random() * 3;
	path.opacity = 0.6;
	
	path.add(new Point(
		Math.random() * view.size.width,
		Math.random() * view.size.height
	));
	path.add(new Point(
		Math.random() * view.size.width,
		Math.random() * view.size.height
	));
}
