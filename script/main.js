$(function(){

var currentColor = 'rgb(0,0,0)';
var currentLineWidth = $('#lineWidth').val();
var currentPath = [];

var canvas = buildCanvas();
var ctx = canvas.getContext('2d');
var tool = new Pencil();

drawPaths();

$(document).keypress(function(e) {
	if(e.charCode == 26 || (e.charCode == 122 && e.ctrlKey)) { // safari
		paths.pop();
		ctx.clearRect(0, 0, $(canvas).width(), $(canvas).height())
		drawPaths();
		save();
	} else if(e.keyCode == 27) { // esc
		$('.colorpicker').slideUp();
	}
});

$('.colors div').click(function(e){
	// mwahaha
	currentColor = getComputedStyle(e.target, null).getPropertyValue('background-color');
});
$('#lineWidth').change(function(e){
	var value = parseInt(e.target.value);
	if(value) currentLineWidth = value;
}).mousedown(function(e) { // pseudo-slider support
	this.dragging = true;
}).mouseup(function(e) {
	this.dragging = false;
}).mousemove(function(e){
	if(!this.dragging) return;
	var val = parseInt(currentLineWidth) + (e.pageX > this.lastX ? 1 : -1);
	this.lastX = e.pageX;
	if(!val) return;
	if(val < 1) val = 1;
	this.value = val;
	currentLineWidth = val;
});
$('#colorpicker').ColorPicker({
	color: '#000',
	onShow: function (colpkr) {
		$(colpkr).slideDown(250);
		return false;
	},
	onHide: function (colpkr) {
		$(colpkr).slideUp(250);
		return false;
	},
	onChange: function (hsb, hex, rgb) {
		$('#colorpicker div').css('backgroundColor', '#' + hex);
		currentColor = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
		changeControlsColor();
	}
});

function drawPaths() {
	if(paths.length == 0) return;

	for(i in paths) {
		var path = paths[i];
		ctx.beginPath();
		ctx.lineWidth   = path.stroke;
		ctx.strokeStyle = path.color;
		ctx.moveTo(path.points[0].x, path.points[0].y)
		for(j = 1; j < path.points.length; j++) {
			var point = path.points[j];
			ctx.lineTo(point.x, point.y);
			ctx.stroke();
		}
		ctx.closePath();
	}
	
	// sets the configs to the last path made
	var last = paths[paths.length - 1];
	currentColor = last.color;
	currentLineWidth = last.stroke;
	$('#lineWidth').val(currentLineWidth);
	function rgb(r, g, b) { return {r: r, g: g, b: b}};
	$('#colorpicker').ColorPickerSetColor(eval(currentColor));
	$('#colorpicker div').css('background-color', currentColor);
	changeControlsColor();
}
function changeControlsColor() {
	var color = currentColor == 'rgb(255,255,255)' ? 'black' : currentColor;
	$('.tools *').css('color', color);
}

function Pencil() {
	var tool = this;
	this.started = false;

	this.mousedown = function(e) {
		ctx.beginPath();
		ctx.moveTo(e._x, e._y);
		tool.started = true;
		
		currentPath = {points: [], color: currentColor, stroke: currentLineWidth};
	};

	this.mousemove = function(e) {
		if (!tool.started) return;

		ctx.lineWidth   = currentLineWidth;
		ctx.strokeStyle = currentColor;
		
		ctx.lineTo(e._x, e._y);
		ctx.stroke();

		currentPath.points.push({x: e._x, y: e._y, });
	};

	this.mouseup = function(e) {
		if (tool.started) {
			tool.mousemove(e);
			tool.started = false;
		}
		
		paths.push(currentPath);
		currentPath = {}
		
		save();
	};
}

function save() {
	$.post('save', {'width': $(canvas).width(),
			'height': $(canvas).height(),
			'url': url, // url is defined outside
			'paths': printPaths()}, function(){
		$('#status').fadeIn().fadeOut();
	});
}

function printPaths() {
	var s = ['['];
	for(i in paths) {
		var path = paths[i];
		s.push('{color:"' + path.color + '",stroke:' + path.stroke + ', points:[');
		for(i in path.points) {
			var point = path.points[i];
			s.push('{x:' + point.x + ',y: ' + point.y + '},');
		}
		
		s.push(']},');
	}
	s.push(']');
	// removes last comma
	return s.join('').replace(/,\]/g, ']');
}

// used for lack of percentage dimensions support
function buildCanvas() {
	var canvasContainer = $('.container')[0];
	var canvas = document.createElement('canvas');
	with(canvas) {
		id = 'canvas';
		width  = canvasWidth  || canvasContainer.scrollWidth;
		height = canvasHeight || canvasContainer.scrollHeight;
		style.width = canvasContainer.style.width + "px";
		style.height = canvasContainer.style.height + "px";
		style.overflow = 'visible';
		style.position = 'absolute';
		addEventListener('mousedown', eventHandler, false);
		addEventListener('mousemove', eventHandler, false);
		addEventListener('mouseup',	 eventHandler, false);
	}
	canvasContainer.appendChild(canvas);
	
	return canvas;
}

function eventHandler(e) {
	if (e.layerX || e.layerX == 0) { // Firefox
		e._x = e.layerX;
		e._y = e.layerY;
	} else if (e.offsetX || e.offsetX == 0) { // Opera
		e._x = e.offsetX;
		e._y = e.offsetY;
	}
	
	// canvas mouse event handling bug
	e._x -= $('canvas').position().left;
	e._y -= $('canvas').position().top;

	tool[e.type](e);
}
});