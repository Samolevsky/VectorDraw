// Scale selected items randomly
var items = pg.selection.getSelectedItems();

for(var i=0; i<items.length; i++) {
	var scale = 0.5 + Math.random() * 1.5;
	items[i].scale(scale);
}
