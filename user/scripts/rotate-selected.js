// Rotate selected items randomly
var items = pg.selection.getSelectedItems();

for(var i=0; i<items.length; i++) {
	var angle = Math.random() * 360;
	items[i].rotate(angle);
}
