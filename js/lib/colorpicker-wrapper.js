/**
 * Modern Color Picker Wrapper - COMPLETE Implementation
 * Full integration with culori for all color conversions
 * Supports RGB, HSL, HSV, HWB, OKLCH with real-time synchronization
 */

(function ($, culori) {
	'use strict';

	if (!culori) {
		console.error('Culori library not loaded! Color picker will not work.');
		return;
	}

	// Extract culori functions
	const { rgb, hsl, hsv, hwb, oklch, formatHex, clampChroma, inGamut } = culori;

	// Utility: Round to decimal places
	const roundTo = (value, decimals = 1) => {
		const factor = Math.pow(10, decimals);
		return Math.round(value * factor) / factor;
	};

	// Color object wrapper compatible with Spectrum.js
	function ColorObject(color) {
		if (typeof color === 'string') {
			try {
				const parsed = culori.parse(color);
				if (!parsed) throw new Error('Invalid color');

				const rgbColor = rgb(parsed);
				this.r = Math.round(rgbColor.r * 255);
				this.g = Math.round(rgbColor.g * 255);
				this.b = Math.round(rgbColor.b * 255);
				this.a = rgbColor.alpha !== undefined ? rgbColor.alpha : 1;
			} catch (e) {
				this.r = 0;
				this.g = 0;
				this.b = 0;
				this.a = 1;
			}
		} else {
			this.r = color.r || 0;
			this.g = color.g || 0;
			this.b = color.b || 0;
			this.a = color.a !== undefined ? color.a : 1;
		}
	}

	ColorObject.prototype.toRgbString = function () {
		if (this.a < 1) {
			return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
		}
		return `rgb(${this.r}, ${this.g}, ${this.b})`;
	};

	ColorObject.prototype.toHexString = function () {
		const hex = formatHex({ mode: 'rgb', r: this.r / 255, g: this.g / 255, b: this.b / 255 });
		return hex;
	};


	// Convert RGB to all color modes
	function rgbToAllModes(r, g, b, a, previousValues) {
		const rgbColor = { mode: 'rgb', r: r / 255, g: g / 255, b: b / 255, alpha: a };

		// HSL
		const hslColor = hsl(rgbColor);
		// Preserve hue when it becomes undefined (saturation=0 or lightness=0/100)
		const hue = hslColor.h !== undefined ? roundTo(hslColor.h, 0) : (previousValues?.hue !== undefined ? previousValues.hue : 0);
		const saturation = roundTo((hslColor.s || 0) * 100, 1);
		const luminosity = roundTo((hslColor.l || 0) * 100, 1);

		// HSV
		const hsvColor = hsv(rgbColor);
		const hsvSaturation = roundTo((hsvColor.s || 0) * 100, 1);
		const value = roundTo((hsvColor.v || 0) * 100, 1);

		// HWB
		const hwbColor = hwb(rgbColor);
		const whiteness = roundTo((hwbColor.w || 0) * 100, 1);
		const blackness = roundTo((hwbColor.b || 0) * 100, 1);

		// OKLCH
		const oklchColor = oklch(rgbColor);
		const oklchLightness = roundTo(oklchColor.l || 0, 3);
		const oklchChroma = roundTo(oklchColor.c || 0, 3);
		const oklchHue = oklchColor.h !== undefined ? roundTo(oklchColor.h, 0) : (previousValues?.oklchHue !== undefined ? previousValues.oklchHue : 0);

		return {
			red: r, green: g, blue: b,
			hue, saturation, luminosity,
			hsvSaturation, value,
			whiteness, blackness,
			oklchLightness, oklchChroma, oklchHue,
			alpha: a
		};
	}

	// Generate gradient for sliders
	function generateGradient(mode, component, currentValues) {
		const steps = component === 'hue' ? 36 : 10;
		const colors = [];

		for (let i = 0; i <= steps; i++) {
			let color;
			const factor = i / steps;

			switch (mode) {
				case 'hsl':
					if (component === 'hue') {
						color = hsl({ h: factor * 360, s: currentValues.saturation / 100, l: currentValues.luminosity / 100 });
					} else if (component === 'saturation') {
						color = hsl({ h: currentValues.hue, s: factor, l: currentValues.luminosity / 100 });
					} else if (component === 'luminosity') {
						color = hsl({ h: currentValues.hue, s: currentValues.saturation / 100, l: factor });
					} else if (component === 'alpha') {
						colors.push(`hsl(${currentValues.hue} ${currentValues.saturation}% ${currentValues.luminosity}% / ${factor})`);
						continue;
					}
					break;

				case 'hsv':
					if (component === 'hue') {
						color = hsv({ h: factor * 360, s: currentValues.hsvSaturation / 100, v: currentValues.value / 100 });
					} else if (component === 'hsvSaturation') {
						color = hsv({ h: currentValues.hue, s: factor, v: currentValues.value / 100 });
					} else if (component === 'value') {
						color = hsv({ h: currentValues.hue, s: currentValues.hsvSaturation / 100, v: factor });
					} else if (component === 'alpha') {
						// Convert HSV to RGB for display
						const hsvColor = hsv({ h: currentValues.hue, s: currentValues.hsvSaturation / 100, v: currentValues.value / 100 });
						const rgbColor = rgb(hsvColor);
						const r = Math.round(rgbColor.r * 255);
						const g = Math.round(rgbColor.g * 255);
						const b = Math.round(rgbColor.b * 255);
						colors.push(`rgba(${r} ${g} ${b} / ${factor})`);
						continue;
					}
					break;

				case 'hwb':
					if (component === 'hue') {
						color = hwb({ h: factor * 360, w: currentValues.whiteness / 100, b: currentValues.blackness / 100 });
					} else if (component === 'whiteness') {
						color = hwb({ h: currentValues.hue, w: factor, b: currentValues.blackness / 100 });
					} else if (component === 'blackness') {
						color = hwb({ h: currentValues.hue, w: currentValues.whiteness / 100, b: factor });
					} else if (component === 'alpha') {
						colors.push(`hwb(${currentValues.hue} ${currentValues.whiteness}% ${currentValues.blackness}% / ${factor})`);
						continue;
					}
					break;

				case 'rgb':
					if (component === 'red') {
						color = rgb({ r: factor, g: currentValues.green / 255, b: currentValues.blue / 255 });
					} else if (component === 'green') {
						color = rgb({ r: currentValues.red / 255, g: factor, b: currentValues.blue / 255 });
					} else if (component === 'blue') {
						color = rgb({ r: currentValues.red / 255, g: currentValues.green / 255, b: factor });
					} else if (component === 'alpha') {
						// For alpha, use rgba with varying alpha
						const r = Math.round((currentValues.red || 0));
						const g = Math.round((currentValues.green || 0));
						const b = Math.round((currentValues.blue || 0));
						colors.push(`rgba(${r} ${g} ${b} / ${factor})`);
						continue;
					}
					break;

				case 'oklch':
					if (component === 'oklchLightness') {
						color = oklch({ l: factor, c: currentValues.oklchChroma, h: currentValues.oklchHue });
					} else if (component === 'oklchChroma') {
						color = oklch({ l: currentValues.oklchLightness, c: factor * 0.37, h: currentValues.oklchHue });
					} else if (component === 'oklchHue') {
						color = oklch({ l: currentValues.oklchLightness, c: currentValues.oklchChroma, h: factor * 360 });
					} else if (component === 'alpha') {
						colors.push(`oklch(${currentValues.oklchLightness} ${currentValues.oklchChroma} ${currentValues.oklchHue} / ${factor})`);
						continue;
					}
					break;
			}

			if (color) {
				const rgbColor = rgb(color);
				const r = Math.round(rgbColor.r * 255);
				const g = Math.round(rgbColor.g * 255);
				const b = Math.round(rgbColor.b * 255);
				colors.push(`rgb(${r} ${g} ${b})`);
			}
		}

		return `linear-gradient(to right, ${colors.join(', ')})`;
	}


	// Main spectrum wrapper
	$.fn.spectrum = function (opts) {
		if (typeof opts === 'string') {
			// Handle method calls
			const method = opts;
			const args = Array.prototype.slice.call(arguments, 1);
			let result;

			this.each(function () {
				const instance = $(this).data('spectrum-instance');
				if (instance && typeof instance[method] === 'function') {
					result = instance[method].apply(instance, args);
				}
			});

			return result !== undefined ? result : this;
		}

		return this.each(function () {
			const $input = $(this);
			const instanceId = 'spectrum-' + Math.random().toString(36).substr(2, 9);

			if (!$input.data('spectrum-id')) {
				$input.data('spectrum-id', instanceId);

				const instance = {
                    opts: $.extend({}, {
                        color: '#000000',
                        showInput: true,
                        allowEmpty: false,
                        clickoutFiresChange: true,
                        chooseText: 'OK',
                        cancelText: 'Cancel',
                        preferredFormat: 'rgb',
                        replacerClassName: '',
                        containerClassName: '',
                        useReplacer: true,
                        positionMode: 'anchor',
                        anchor: null
                    }, opts),
					currentColor: null,
					originalColor: null,
					currentValues: null,
					isOpen: false,
					$container: null,
					$replacer: null,
					$input: $input,

					// API methods
					get: function () {
						return this.currentColor;
					},
					set: function (color) {
						this.currentColor = new ColorObject(color);
						this.currentValues = rgbToAllModes(this.currentColor.r, this.currentColor.g, this.currentColor.b, this.currentColor.a, this.currentValues);
						updateReplacerColor(this);
						if (this.$container && this.isOpen) {
							updatePickerFromColor(this);
						}
					},
					show: function () {
						showPicker(this);
					},
					hide: function () {
						hidePicker(this);
					},
					destroy: function () {
						if (this.$container) {
							this.$container.remove();
						}
						if (this.$replacer) {
							this.$replacer.remove();
						}
						$(document).off('.' + this.$input.data('spectrum-id'));
						$(document).off('.' + this.$input.data('spectrum-id') + '-drag');
						this.$input.removeData('spectrum-id spectrum-instance');
					}
				};

				// Initialize
				instance.currentColor = new ColorObject(instance.opts.color);
				instance.originalColor = new ColorObject(instance.opts.color);
				instance.currentValues = rgbToAllModes(instance.currentColor.r, instance.currentColor.g, instance.currentColor.b, instance.currentColor.a, null);

                // Create replacer (swatch button) if enabled
                if (instance.opts.useReplacer) {
                    createReplacer(instance);
                }

                // Create picker container
                createPicker(instance);

				// Store instance
				$input.data('spectrum-instance', instance);
			}
		});
	};


	function createReplacer(instance) {
        const $replacer = $('<div class="sp-replacer"></div>');
        const $preview = $('<div class="sp-preview"><div class="sp-preview-inner"></div></div>');

		if (instance.opts.replacerClassName) {
			$replacer.addClass(instance.opts.replacerClassName);
		}

		$replacer.append($preview);
        instance.$input.after($replacer);
        instance.$input.hide();
        instance.$replacer = $replacer;

		updateReplacerColor(instance);

		$replacer.on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (instance.isOpen) {
				hidePicker(instance);
			} else {
				showPicker(instance);
			}
		});
	}

	function updateReplacerColor(instance) {
		if (!instance.$replacer) return;

		const $preview = instance.$replacer.find('.sp-preview');
		const $previewInner = instance.$replacer.find('.sp-preview-inner');
		const color = instance.currentColor;

		if (!color || (instance.opts.allowEmpty && color.a === 0)) {
			$preview.addClass('sp-clear-display');
			$previewInner.css('background-color', 'transparent');
		} else {
			$preview.removeClass('sp-clear-display');
			const colorStr = color.toRgbString();

			if (instance.opts.replacerClassName.includes('stroke')) {
				// Stroke: set border color on preview
				$preview.css('border-color', colorStr);
				$previewInner.css('opacity', '0'); // Keep inner transparent for stroke
			} else {
				// Fill: set background color on inner
				$previewInner.css({
					'background-color': colorStr,
					'opacity': '1',
					'display': 'block'
				});
			}
		}
	}


	function createPicker(instance) {
		const $container = $('<div class="modern-colorpicker-popup"></div>');
		const containerId = 'picker-' + instance.$input.data('spectrum-id');
		$container.attr('id', containerId);

		if (instance.opts.containerClassName) {
			$container.addClass(instance.opts.containerClassName);
		}

		const html = `
			<div class="colorpicker-embed">
				<div class="colorpicker-content" id="${containerId}-content">
					<div class="slider-choices">
						<button type="button" class="colorpicker-clear-btn" title="No color"></button>
						<button type="button" class="mode-btn" data-mode="rgb">RGB</button>
						<button type="button" class="mode-btn active" data-mode="hsl">HSL</button>
						<button type="button" class="mode-btn" data-mode="hsv">HSV</button>
						<button type="button" class="mode-btn" data-mode="hwb">HWB</button>
						<button type="button" class="mode-btn" data-mode="oklch">OKLCH</button>
						<div class="colorpicker-drag-handle" title="Drag to move"></div>
					</div>
					<div class="main">
						<div>
							<div class="color-swatch"></div>
							<div class="color-code">
								<input type="text" name="hex" class="hex-input" value="${instance.currentColor.toHexString()}" 
									autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
								<button aria-label="copy code" type="button" class="copy-code" title="Copy value">
									<svg class="copy-icon" title="Copy value" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
										<polygon points="31 24 27 24 27 20 25 20 25 24 21 24 21 26 25 26 25 30 27 30 27 26 31 26 31 24"/>
										<path d="M25,5H22V4a2.0058,2.0058,0,0,0-2-2H12a2.0058,2.0058,0,0,0-2,2V5H7A2.0058,2.0058,0,0,0,5,7V28a2.0058,2.0058,0,0,0,2,2H17V28H7V7h3v3H22V7h3v9h2V7A2.0058,2.0058,0,0,0,25,5ZM20,8H12V4h8Z"/>
									</svg>
									<svg class="copy-success-icon" title="Copy value" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
										<polygon points="22 27.18 19.41 24.59 18 26 22 30 30 22 28.59 20.59 22 27.18"/>
										<path d="M25,5H22V4a2.0058,2.0058,0,0,0-2-2H12a2.0058,2.0058,0,0,0-2,2V5H7A2.0058,2.0058,0,0,0,5,7V28a2.0058,2.0058,0,0,0,2,2h9V28H7V7h3v3H22V7h3V18h2V7A2.0058,2.0058,0,0,0,25,5ZM20,8H12V4h8Z"/>
									</svg>
								</button>
							</div>
						</div>
						<div class="color-pickers"></div>
					</div>
				</div>
				<div class="colorpicker-buttons">
					<button type="button" class="colorpicker-eyedropper-btn" title="Sample color from canvas">
						<svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
							<rect x="2" y="27" width="3" height="3"/>
							<path d="M29.71,7.29l-5-5a1,1,0,0,0-1.41,0h0L20,5.59l-1.29-1.3L17.29,5.71,18.59,7,8.29,17.29A1,1,0,0,0,8,18v1.59l-2.71,2.7a1,1,0,0,0,0,1.41h0l3,3a1,1,0,0,0,1.41,0h0L12.41,24H14a1,1,0,0,0,.71-.29L25,13.41l1.29,1.3,1.42-1.42L26.41,12l3.3-3.29a1,1,0,0,0,0-1.41ZM13.59,22h-2L9,24.59,7.41,23,10,20.41v-2l10-10L23.59,12ZM25,10.59,21.41,7,24,4.41,27.59,8Z"/>
						</svg>
					</button>
					<button class="sp-cancel">${instance.opts.cancelText}</button>
					<button class="sp-choose">${instance.opts.chooseText}</button>
				</div>
			</div>
		`;

		$container.html(html);
		$('body').append($container);

		instance.$container = $container;

		setupEventHandlers(instance);
		setupDragHandlers(instance);
		updateColorModePickers(instance);
		updatePickerFromColor(instance);
	}

	function setupDragHandlers(instance) {
		const $container = instance.$container;
		const $dragHandle = $container.find('.colorpicker-drag-handle');

		let isDragging = false;
		let startX, startY, startLeft, startTop;

		$dragHandle.on('mousedown', function (e) {
			isDragging = true;
			$container.addClass('dragging');

			const offset = $container.offset();
			startX = e.pageX;
			startY = e.pageY;
			startLeft = offset.left;
			startTop = offset.top;

			e.preventDefault();
		});

		$(document).on('mousemove.' + instance.$input.data('spectrum-id') + '-drag', function (e) {
			if (!isDragging) return;

			const deltaX = e.pageX - startX;
			const deltaY = e.pageY - startY;

			const newLeft = startLeft + deltaX;
			const newTop = startTop + deltaY;

			// Keep within viewport bounds
			const windowWidth = $(window).width();
			const windowHeight = $(window).height();
			const pickerWidth = $container.outerWidth();
			const pickerHeight = $container.outerHeight();

			const boundedLeft = Math.max(0, Math.min(newLeft, windowWidth - pickerWidth));
			const boundedTop = Math.max(0, Math.min(newTop, windowHeight - pickerHeight));

			$container.css({
				left: boundedLeft,
				top: boundedTop
			});

			e.preventDefault();
		});

		$(document).on('mouseup.' + instance.$input.data('spectrum-id') + '-drag', function () {
			if (isDragging) {
				isDragging = false;
				$container.removeClass('dragging');
			}
		});
	}


	function setupEventHandlers(instance) {
		const $container = instance.$container;

		// Hex input change
		$container.find('.hex-input').on('change', function () {
			const hex = $(this).val();
			try {
				instance.currentColor = new ColorObject(hex);
				instance.currentValues = rgbToAllModes(instance.currentColor.r, instance.currentColor.g, instance.currentColor.b, instance.currentColor.a, instance.currentValues);
				updateReplacerColor(instance);
				updatePickerFromColor(instance);

				if (instance.opts.move) {
					instance.opts.move(instance.currentColor);
				}
			} catch (e) {
				console.error('Invalid hex color:', hex);
			}
		});

		// Copy button (delegated for dynamically created buttons)
		$container.on('click', '.copy-code', function (e) {
			e.preventDefault();
			e.stopPropagation();
			const $btn = $(e.currentTarget);
			const mode = $btn.data('mode');

			let textToCopy;
			if (mode) {
				// Copy mode-specific color string
				textToCopy = $btn.siblings('input[data-mode="' + mode + '"]').val();
			} else {
				// Copy hex from top
				textToCopy = $container.find('.hex-input').val();
			}

			// Copy to clipboard
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(textToCopy).then(function () {
					// Visual feedback - show success icon
					$btn.addClass('copied');
					setTimeout(function () {
						$btn.removeClass('copied');
					}, 1000);
				}).catch(function (err) {
					console.error('Failed to copy:', err);
				});
			} else {
				// Fallback for older browsers
				const $input = mode ? $btn.siblings('input[data-mode="' + mode + '"]') : $container.find('.hex-input');
				$input.select();
				try {
					document.execCommand('copy');
					$btn.addClass('copied');
					setTimeout(function () {
						$btn.removeClass('copied');
					}, 1000);
				} catch (err) {
					console.error('Failed to copy:', err);
				}
			}
		});

		// Clear button
		$container.find('.sp-clear').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			instance.currentColor = new ColorObject({ r: 0, g: 0, b: 0, a: 0 });
			instance.currentValues = rgbToAllModes(0, 0, 0, 0, instance.currentValues);
			updateReplacerColor(instance);
			if (instance.opts.change) {
				instance.opts.change(instance.currentColor);
			}
			hidePicker(instance);
			if (instance.opts.hide) {
				instance.opts.hide();
			}
		});

		// Choose button
		$container.find('.sp-choose').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (instance.opts.change) {
				instance.opts.change(instance.currentColor);
			}
			updateReplacerColor(instance);

			// Trigger jQuery change event for compatibility
			instance.$input.trigger('change.spectrum', [instance.currentColor]);

			hidePicker(instance);
			if (instance.opts.hide) {
				instance.opts.hide();
			}
		});

		// Cancel button
		$container.find('.sp-cancel').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			instance.currentColor = new ColorObject(instance.originalColor.toRgbString());
			instance.currentValues = rgbToAllModes(instance.currentColor.r, instance.currentColor.g, instance.currentColor.b, instance.currentColor.a, instance.currentValues);
			updateReplacerColor(instance);
			updatePickerFromColor(instance);

			// Trigger change event to restore the original color on canvas
			if (instance.opts.change) {
				instance.opts.change(instance.currentColor);
			}

			hidePicker(instance);
			if (instance.opts.hide) {
				instance.opts.hide();
			}
		});

		// Click outside to close
		$(document).on('mousedown.' + instance.$input.data('spectrum-id'), function (e) {
			// Don't close if eyedropper is active
			if (instance.eyedropperActive) {
				return;
			}

			if (instance.isOpen &&
				!$container.is(e.target) &&
				$container.has(e.target).length === 0 &&
				!instance.$replacer.is(e.target) &&
				instance.$replacer.has(e.target).length === 0) {
				if (instance.opts.clickoutFiresChange) {
					if (instance.opts.change) {
						instance.opts.change(instance.currentColor);
					}
					// Trigger jQuery change event
					instance.$input.trigger('change.spectrum', [instance.currentColor]);
				}
				hidePicker(instance);
				if (instance.opts.hide) {
					instance.opts.hide();
				}
			}
		});

		// Mode buttons (segmented control)
		$container.find('.slider-choices .mode-btn').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();

			// Update active state
			$container.find('.slider-choices .mode-btn').removeClass('active');
			$(this).addClass('active');

			updateColorModePickers(instance);
		});

		// Clear color button
		$container.find('.colorpicker-clear-btn').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();

			// Set color to transparent
			instance.currentColor = new ColorObject({ r: 0, g: 0, b: 0, a: 0 });
			instance.currentValues = rgbToAllModes(0, 0, 0, 0, instance.currentValues);
			updateReplacerColor(instance);
			updatePickerFromColor(instance);

			if (instance.opts.move) {
				instance.opts.move(instance.currentColor);
			}
		});

		// Eyedropper button - using event delegation
		$container.on('click', '.colorpicker-eyedropper-btn', function (e) {
			console.log('=== EYEDROPPER BUTTON CLICKED ===');
			e.preventDefault();
			e.stopPropagation();

			const $btn = $(this);
			console.log('Button element:', $btn);

			// Cleanup function - defined first for proper scoping
			let cleanupEyedropper;
			let handleCanvasClick;
			let handleEscape;

			// Toggle eyedropper mode
			if (instance.eyedropperActive) {
				console.log('Eyedropper already active - deactivating');
				// Deactivate eyedropper using stored cleanup function
				if (instance.cleanupEyedropper) {
					instance.cleanupEyedropper();
				}
				return;
			}

			// Activate eyedropper
			console.log('Activating eyedropper...');
			instance.eyedropperActive = true;
			$btn.addClass('active');
			console.log('Button active class added');

			// Change cursor to eyedropper
			const $canvas = jQuery('#paperCanvas');
			const canvasElement = document.getElementById('paperCanvas');

			console.log('Canvas element:', canvasElement);
			console.log('Canvas jQuery:', $canvas);

			if (!canvasElement) {
				console.error('Eyedropper: Canvas element not found!');
				instance.eyedropperActive = false;
				$btn.removeClass('active');
				return;
			}

			console.log('Adding cursor-eyedropper class to canvas');
			
			// Store current cursor classes to restore later
			const currentClasses = canvasElement.className;
			instance.previousCanvasClasses = currentClasses;
			console.log('Storing previous canvas classes:', currentClasses);
			
			// Remove all cursor classes and add eyedropper
			$canvas.removeClass(function(index, className) {
				return (className.match(/\bcursor-\S+/g) || []).join(' ');
			});
			$canvas.addClass('cursor-eyedropper');
			
			// Hide the color input blocker so we can click on the canvas
			const $blocker = jQuery('#colorInputBlocker');
			const blockerWasVisible = $blocker.is(':visible');
			instance.blockerWasVisible = blockerWasVisible;
			if (blockerWasVisible) {
				console.log('Hiding colorInputBlocker to allow canvas clicks');
				$blocker.hide();
			}
			
			// Verify cursor class was added
			setTimeout(function() {
				console.log('Canvas classes after 100ms:', canvasElement.className);
				console.log('Has cursor-eyedropper class:', $canvas.hasClass('cursor-eyedropper'));
			}, 100);

			// Create one-time mousedown handler on the document using native addEventListener with capture
			handleCanvasClick = function (event) {
				console.log('Document mousedown captured, target:', event.target);
				
				// Check if the click is on the canvas
				if (event.target !== canvasElement) {
					console.log('Click not on canvas, ignoring');
					return;
				}
				
				console.log('Canvas mousedown for eyedropper sampling');
				
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();

				// Get the click position relative to the canvas
				const rect = canvasElement.getBoundingClientRect();
				const x = event.clientX - rect.left;
				const y = event.clientY - rect.top;

				console.log('Click position:', x, y, 'Canvas rect:', rect);

				// Check if Paper.js is available
				if (typeof paper === 'undefined') {
					console.error('Paper.js is not available!');
					cleanupEyedropper();
					return;
				}

				// Convert to Paper.js point - account for view transformation
				const point = paper.view.viewToProject(new paper.Point(x, y));
				console.log('Paper.js point:', point);

				// Hit test to find item at this point
				const hitOptions = {
					segments: true,
					stroke: true,
					curves: true,
					fill: true,
					guide: false,
					tolerance: 5 / paper.view.zoom
				};

				const hitResult = paper.project.hitTest(point, hitOptions);
				console.log('Hit result:', hitResult);

				if (hitResult && hitResult.item) {
					let sampledColor = null;

					// Get the active color swatch to determine which color to sample
					const activeSwatch = pg.stylebar.getActiveColorSwatch();
					console.log('Active swatch:', activeSwatch);

					if (activeSwatch === 'fill' && hitResult.item.fillColor) {
						sampledColor = hitResult.item.fillColor.toCSS();
					} else if (activeSwatch === 'stroke' && hitResult.item.strokeColor) {
						sampledColor = hitResult.item.strokeColor.toCSS();
					} else if (hitResult.item.fillColor) {
						// Default to fill color if available
						sampledColor = hitResult.item.fillColor.toCSS();
					} else if (hitResult.item.strokeColor) {
						// Fall back to stroke color
						sampledColor = hitResult.item.strokeColor.toCSS();
					}

					console.log('Sampled color:', sampledColor);

					if (sampledColor) {
						// Update the color picker with the sampled color
						instance.currentColor = new ColorObject(sampledColor);
						instance.currentValues = rgbToAllModes(
							instance.currentColor.r,
							instance.currentColor.g,
							instance.currentColor.b,
							instance.currentColor.a,
							instance.currentValues
						);
						updateReplacerColor(instance);
						updatePickerFromColor(instance);

						if (instance.opts.move) {
							instance.opts.move(instance.currentColor);
						}
						
						console.log('Color picker updated successfully');
					}
				} else {
					console.log('No item found at click position');
				}

				// Clean up after sampling
				cleanupEyedropper();
			};

			// Cleanup function
			cleanupEyedropper = function () {
				console.log('Cleaning up eyedropper');
				instance.eyedropperActive = false;
				$btn.removeClass('active');
				
				// Remove eyedropper cursor
				$canvas.removeClass('cursor-eyedropper');
				
				// Restore previous cursor classes if stored
				if (instance.previousCanvasClasses) {
					const previousCursorClasses = instance.previousCanvasClasses.match(/\bcursor-\S+/g);
					if (previousCursorClasses) {
						$canvas.addClass(previousCursorClasses.join(' '));
					}
					instance.previousCanvasClasses = null;
				}
				
				// Restore the color input blocker if it was visible
				if (instance.blockerWasVisible) {
					console.log('Restoring colorInputBlocker');
					jQuery('#colorInputBlocker').show();
					instance.blockerWasVisible = false;
				}
				if (handleCanvasClick) {
					document.removeEventListener('mousedown', handleCanvasClick, true);
				}
				if (handleEscape) {
					document.removeEventListener('keydown', handleEscape);
				}
				instance.cleanupEyedropper = null;
			};

			// Store cleanup function for external access
			instance.cleanupEyedropper = cleanupEyedropper;

			// Attach the mousedown handler to the document to catch it before Paper.js
			// Using capture phase and document level to ensure we get the event first
			document.addEventListener('mousedown', handleCanvasClick, true);
			console.log('Document mousedown handler attached (capture phase)');

			// Also set up escape key to cancel
			handleEscape = function (event) {
				if (event.key === 'Escape') {
					console.log('Eyedropper cancelled with Escape');
					cleanupEyedropper();
				}
			};
			document.addEventListener('keydown', handleEscape);

			// Set up a timeout to clear the flag if user doesn't sample
			setTimeout(function () {
				if (instance.eyedropperActive) {
					console.log('Eyedropper timeout - auto cleanup');
					cleanupEyedropper();
				}
			}, 30000); // 30 second timeout
		});
	}


	function updateColorModePickers(instance) {
		const $container = instance.$container;
		const $pickers = $container.find('.color-pickers');

		// Get the active mode (only one at a time)
		const $activeBtn = $container.find('.slider-choices .mode-btn.active');
		const activeMode = $activeBtn.data('mode');

		if (!activeMode) return;

		$pickers.empty();

		// Only show the active mode
		const mode = activeMode;
		const pickerHTML = createColorModePicker(mode, instance.currentValues);
		const $picker = $(pickerHTML);
		$pickers.append($picker);

		// Attach event handlers
		$picker.find('input[type="range"]').on('input', function () {
			handleSliderChange(instance, mode, $(this).attr('name'), $(this).val());
		});

		$picker.find('input[type="number"]').on('change', function () {
			const name = $(this).attr('name').replace('Num', '');
			handleSliderChange(instance, mode, name, $(this).val());
		});

		// Add keyboard shortcuts for number inputs
		$picker.find('input[type="number"]').on('keydown', function (e) {
			const $input = $(this);
			const name = $input.attr('name').replace('Num', '');
			const currentValue = parseFloat($input.val()) || 0;
			const min = parseFloat($input.attr('min'));
			const max = parseFloat($input.attr('max'));
			const step = parseFloat($input.attr('step')) || 1;

			let newValue = currentValue;
			let handled = false;

			// Arrow Up/Down keys
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				const direction = e.key === 'ArrowUp' ? 1 : -1;

				if (e.metaKey || e.ctrlKey) {
					// Cmd/Ctrl + Arrow: increment by 0.1 (for decimal values)
					if (step < 1) {
						newValue = currentValue + (direction * 0.1);
						handled = true;
					}
				} else if (e.shiftKey) {
					// Shift + Arrow: increment by 10 (only if max > 10)
					if (max > 10) {
						newValue = currentValue + (direction * 10);
						handled = true;
					}
				} else {
					// Arrow only: increment by 1
					newValue = currentValue + direction;
					handled = true;
				}
			}
			// Enter key: confirm and blur
			else if (e.key === 'Enter') {
				$input.blur();
				handled = true;
			}

			if (handled && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
				e.preventDefault();

				// Clamp to min/max
				newValue = Math.max(min, Math.min(max, newValue));

				// Round to appropriate decimal places based on step
				if (step < 1) {
					const decimals = step.toString().split('.')[1]?.length || 1;
					newValue = parseFloat(newValue.toFixed(decimals));
				} else {
					newValue = Math.round(newValue);
				}

				$input.val(newValue);
				handleSliderChange(instance, mode, name, newValue);
			}
		});

		// Add double-click and right-click handlers for alpha sliders to reset to 1 (100%)
		$picker.find('input[type="range"][name="alpha"]').on('dblclick contextmenu', function (e) {
			e.preventDefault();
			handleSliderChange(instance, mode, 'alpha', 1);
			return false;
		});

		$picker.find('input[type="number"][name="alphaNum"]').on('dblclick contextmenu', function (e) {
			e.preventDefault();
			handleSliderChange(instance, mode, 'alpha', 1);
			return false;
		});
	}

	function createColorModePicker(mode, values) {
		const modes = {
			rgb: [
				{ name: 'red', label: 'R', tooltip: 'Red Channel', min: 0, max: 255, step: 1, value: Math.round(values.red || 0) },
				{ name: 'green', label: 'G', tooltip: 'Green Channel', min: 0, max: 255, step: 1, value: Math.round(values.green || 0) },
				{ name: 'blue', label: 'B', tooltip: 'Blue Channel', min: 0, max: 255, step: 1, value: Math.round(values.blue || 0) },
				{ name: 'alpha', label: 'A', tooltip: 'Alpha (Opacity)', min: 0, max: 1, step: 0.01, value: (values.alpha !== undefined ? values.alpha : 1) }
			],
			hsl: [
				{ name: 'hue', label: 'H', tooltip: 'Hue', min: 0, max: 360, step: 1, value: Math.round(values.hue || 0) },
				{ name: 'saturation', label: 'S', tooltip: 'Saturation', min: 0, max: 100, step: 0.1, value: roundTo(values.saturation || 0, 1) },
				{ name: 'luminosity', label: 'L', tooltip: 'Lightness', min: 0, max: 100, step: 0.1, value: roundTo(values.luminosity || 0, 1) },
				{ name: 'alpha', label: 'A', tooltip: 'Alpha (Opacity)', min: 0, max: 1, step: 0.01, value: (values.alpha !== undefined ? values.alpha : 1) }
			],
			hsv: [
				{ name: 'hue', label: 'H', tooltip: 'Hue', min: 0, max: 360, step: 1, value: Math.round(values.hue || 0) },
				{ name: 'hsvSaturation', label: 'S', tooltip: 'Saturation', min: 0, max: 100, step: 0.1, value: roundTo(values.hsvSaturation || 0, 1) },
				{ name: 'value', label: 'V', tooltip: 'Value (Brightness)', min: 0, max: 100, step: 0.1, value: roundTo(values.value || 0, 1) },
				{ name: 'alpha', label: 'A', tooltip: 'Alpha (Opacity)', min: 0, max: 1, step: 0.01, value: (values.alpha !== undefined ? values.alpha : 1) }
			],
			hwb: [
				{ name: 'hue', label: 'H', tooltip: 'Hue', min: 0, max: 360, step: 1, value: Math.round(values.hue || 0) },
				{ name: 'whiteness', label: 'W', tooltip: 'Whiteness', min: 0, max: 100, step: 0.1, value: roundTo(values.whiteness || 0, 1) },
				{ name: 'blackness', label: 'B', tooltip: 'Blackness', min: 0, max: 100, step: 0.1, value: roundTo(values.blackness || 0, 1) },
				{ name: 'alpha', label: 'A', tooltip: 'Alpha (Opacity)', min: 0, max: 1, step: 0.01, value: (values.alpha !== undefined ? values.alpha : 1) }
			],
			oklch: [
				{ name: 'oklchLightness', label: 'L', tooltip: 'Lightness', min: 0, max: 1, step: 0.001, value: roundTo(values.oklchLightness || 0, 3) },
				{ name: 'oklchChroma', label: 'C', tooltip: 'Chroma (Colorfulness)', min: 0, max: 0.37, step: 0.001, value: roundTo(values.oklchChroma || 0, 3) },
				{ name: 'oklchHue', label: 'H', tooltip: 'Hue', min: 0, max: 360, step: 1, value: Math.round(values.oklchHue || 0) },
				{ name: 'alpha', label: 'A', tooltip: 'Alpha (Opacity)', min: 0, max: 1, step: 0.01, value: (values.alpha !== undefined ? values.alpha : 1) }
			]
		};

		const modeConfig = modes[mode];
		if (!modeConfig) return '';

		// Generate color string for this mode
		let colorString = '';
		switch (mode) {
			case 'rgb':
				colorString = values.alpha < 1
					? `rgba(${Math.round(values.red || 0)} ${Math.round(values.green || 0)} ${Math.round(values.blue || 0)} / ${values.alpha})`
					: `rgb(${Math.round(values.red || 0)} ${Math.round(values.green || 0)} ${Math.round(values.blue || 0)})`;
				break;
			case 'hsl':
				colorString = values.alpha < 1
					? `hsla(${Math.round(values.hue || 0)} ${roundTo(values.saturation || 0, 1)}% ${roundTo(values.luminosity || 0, 1)}% / ${values.alpha})`
					: `hsl(${Math.round(values.hue || 0)} ${roundTo(values.saturation || 0, 1)}% ${roundTo(values.luminosity || 0, 1)}%)`;
				break;
			case 'hsv':
				colorString = values.alpha < 1
					? `hsva(${Math.round(values.hue || 0)} ${roundTo(values.hsvSaturation || 0, 1)}% ${roundTo(values.value || 0, 1)}% / ${values.alpha})`
					: `hsv(${Math.round(values.hue || 0)} ${roundTo(values.hsvSaturation || 0, 1)}% ${roundTo(values.value || 0, 1)}%)`;
				break;
			case 'hwb':
				colorString = values.alpha < 1
					? `hwba(${Math.round(values.hue || 0)} ${roundTo(values.whiteness || 0, 1)}% ${roundTo(values.blackness || 0, 1)}% / ${values.alpha})`
					: `hwb(${Math.round(values.hue || 0)} ${roundTo(values.whiteness || 0, 1)}% ${roundTo(values.blackness || 0, 1)}%)`;
				break;
			case 'oklch':
				colorString = values.alpha < 1
					? `oklch(${roundTo(values.oklchLightness || 0, 3)} ${roundTo(values.oklchChroma || 0, 3)} ${Math.round(values.oklchHue || 0)} / ${values.alpha})`
					: `oklch(${roundTo(values.oklchLightness || 0, 3)} ${roundTo(values.oklchChroma || 0, 3)} ${Math.round(values.oklchHue || 0)})`;
				break;
		}

		let html = `<div class="color-picker" data-mode="${mode}">`;

		modeConfig.forEach(slider => {
			// Clamp value to min/max range
			const clampedValue = Math.max(slider.min, Math.min(slider.max, slider.value));
			const percent = Math.max(0, Math.min(100, ((clampedValue - slider.min) / (slider.max - slider.min)) * 100));
			const gradient = generateGradient(mode, slider.name, values);

			html += `
			<div class="color-slider">
				<div class="slider-track">
					<input type="range" 
						data-mode="${mode}" 
						name="${slider.name}" 
						min="${slider.min}" 
						max="${slider.max}" 
						step="${slider.step}" 
						value="${clampedValue}"
						style="background: ${gradient}">
					<div class="custom-slider-handle" style="left: ${percent}%"></div>
				</div>
				<input type="number" 
					data-mode="${mode}" 
					name="${slider.name}Num" 
					title="${slider.tooltip}"
					min="${slider.min}" 
					max="${slider.max}" 
					step="${slider.step}" 
					value="${clampedValue}">
			</div>
		`;
		});

		// Add color-code input at the bottom of each picker
		html += `
			<div class="color-code">
				<input type="text" 
					name="${mode}" 
					class="mode-color-input"
					data-mode="${mode}"
					value="${colorString}"
					autocomplete="off" 
					autocorrect="off" 
					autocapitalize="off" 
					spellcheck="false">
				<button aria-label="copy code" type="button" class="copy-code" data-mode="${mode}" title="Copy value">
					<svg class="copy-icon" title="Copy value" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
						<polygon points="31 24 27 24 27 20 25 20 25 24 21 24 21 26 25 26 25 30 27 30 27 26 31 26 31 24"/>
						<path d="M25,5H22V4a2.0058,2.0058,0,0,0-2-2H12a2.0058,2.0058,0,0,0-2,2V5H7A2.0058,2.0058,0,0,0,5,7V28a2.0058,2.0058,0,0,0,2,2H17V28H7V7h3v3H22V7h3v9h2V7A2.0058,2.0058,0,0,0,25,5ZM20,8H12V4h8Z"/>
					</svg>
					<svg class="copy-success-icon" title="Copy value" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
						<polygon points="22 27.18 19.41 24.59 18 26 22 30 30 22 28.59 20.59 22 27.18"/>
						<path d="M25,5H22V4a2.0058,2.0058,0,0,0-2-2H12a2.0058,2.0058,0,0,0-2,2V5H7A2.0058,2.0058,0,0,0,5,7V28a2.0058,2.0058,0,0,0,2,2h9V28H7V7h3v3H22V7h3V18h2V7A2.0058,2.0058,0,0,0,25,5ZM20,8H12V4h8Z"/>
					</svg>
				</button>
			</div>
		`;

		html += '</div>';
		return html;
	}


	function handleSliderChange(instance, mode, component, value) {
		const numValue = parseFloat(value);
		instance.currentValues[component] = numValue;

		// Convert from current mode to RGB
		let color;
		try {
			switch (mode) {
				case 'rgb':
					color = rgb({
						r: instance.currentValues.red / 255,
						g: instance.currentValues.green / 255,
						b: instance.currentValues.blue / 255,
						alpha: instance.currentValues.alpha
					});
					break;
				case 'hsl':
					color = hsl({
						h: instance.currentValues.hue,
						s: instance.currentValues.saturation / 100,
						l: instance.currentValues.luminosity / 100,
						alpha: instance.currentValues.alpha
					});
					break;
				case 'hsv':
					color = hsv({
						h: instance.currentValues.hue,
						s: instance.currentValues.hsvSaturation / 100,
						v: instance.currentValues.value / 100,
						alpha: instance.currentValues.alpha
					});
					break;
				case 'hwb':
					color = hwb({
						h: instance.currentValues.hue,
						w: instance.currentValues.whiteness / 100,
						b: instance.currentValues.blackness / 100,
						alpha: instance.currentValues.alpha
					});
					break;
				case 'oklch':
					color = oklch({
						l: instance.currentValues.oklchLightness,
						c: instance.currentValues.oklchChroma,
						h: instance.currentValues.oklchHue,
						alpha: instance.currentValues.alpha
					});
					break;
			}

			if (color) {
				const rgbColor = rgb(color);
				instance.currentColor = new ColorObject({
					r: Math.round(rgbColor.r * 255),
					g: Math.round(rgbColor.g * 255),
					b: Math.round(rgbColor.b * 255),
					a: rgbColor.alpha !== undefined ? rgbColor.alpha : 1
				});

				// Update all values (preserve hue when it becomes undefined)
				instance.currentValues = rgbToAllModes(instance.currentColor.r, instance.currentColor.g, instance.currentColor.b, instance.currentColor.a, instance.currentValues);

				// Update UI
				updatePickerFromColor(instance);

				// Trigger move event (callback)
				if (instance.opts.move) {
					instance.opts.move(instance.currentColor);
				}

				// Trigger jQuery events for compatibility
				instance.$input.trigger('move.spectrum', [instance.currentColor]);

				// Update replacer color AFTER triggering events (with small delay to ensure DOM updates)
				setTimeout(function () {
					updateReplacerColor(instance);
				}, 0);
			}
		} catch (e) {
			console.error('Color conversion error:', e);
		}
	}

	function updatePickerFromColor(instance) {
		const $container = instance.$container;
		const color = instance.currentColor;
		const values = instance.currentValues;

		// Update hex input
		$container.find('.hex-input').val(color.toHexString());

		// Update color swatch (using CSS color property for the ::before pseudo-element)
		const $swatch = $container.find('.color-swatch');
		$swatch.css('color', color.toRgbString());

		// Show/hide checkerboard based on alpha
		if (values.alpha < 1) {
			$swatch.addClass('has-transparency');
		} else {
			$swatch.removeClass('has-transparency');
		}

		// Update mode color inputs
		$container.find('.mode-color-input').each(function () {
			const $input = $(this);
			const mode = $input.data('mode');
			let colorString = '';

			switch (mode) {
				case 'rgb':
					colorString = values.alpha < 1
						? `rgba(${Math.round(values.red || 0)} ${Math.round(values.green || 0)} ${Math.round(values.blue || 0)} / ${values.alpha})`
						: `rgb(${Math.round(values.red || 0)} ${Math.round(values.green || 0)} ${Math.round(values.blue || 0)})`;
					break;
				case 'hsl':
					colorString = values.alpha < 1
						? `hsla(${Math.round(values.hue || 0)} ${roundTo(values.saturation || 0, 1)}% ${roundTo(values.luminosity || 0, 1)}% / ${values.alpha})`
						: `hsl(${Math.round(values.hue || 0)} ${roundTo(values.saturation || 0, 1)}% ${roundTo(values.luminosity || 0, 1)}%)`;
					break;
				case 'hsv':
					colorString = values.alpha < 1
						? `hsva(${Math.round(values.hue || 0)} ${roundTo(values.hsvSaturation || 0, 1)}% ${roundTo(values.value || 0, 1)}% / ${values.alpha})`
						: `hsv(${Math.round(values.hue || 0)} ${roundTo(values.hsvSaturation || 0, 1)}% ${roundTo(values.value || 0, 1)}%)`;
					break;
				case 'hwb':
					colorString = values.alpha < 1
						? `hwba(${Math.round(values.hue || 0)} ${roundTo(values.whiteness || 0, 1)}% ${roundTo(values.blackness || 0, 1)}% / ${values.alpha})`
						: `hwb(${Math.round(values.hue || 0)} ${roundTo(values.whiteness || 0, 1)}% ${roundTo(values.blackness || 0, 1)}%)`;
					break;
				case 'oklch':
					colorString = values.alpha < 1
						? `oklch(${roundTo(values.oklchLightness || 0, 3)} ${roundTo(values.oklchChroma || 0, 3)} ${Math.round(values.oklchHue || 0)} / ${values.alpha})`
						: `oklch(${roundTo(values.oklchLightness || 0, 3)} ${roundTo(values.oklchChroma || 0, 3)} ${Math.round(values.oklchHue || 0)})`;
					break;
			}

			$input.val(colorString);
		});

		// Update all sliders and inputs
		$container.find('input[type="range"], input[type="number"]').each(function () {
			const $input = $(this);
			const name = $input.attr('name').replace('Num', '');

			if (values[name] !== undefined) {
				$input.val(values[name]);

				// Update slider handle position
				if ($input.attr('type') === 'range') {
					const min = parseFloat($input.attr('min'));
					const max = parseFloat($input.attr('max'));
					// Clamp value to min/max range
					const clampedValue = Math.max(min, Math.min(max, values[name]));
					const percent = Math.max(0, Math.min(100, ((clampedValue - min) / (max - min)) * 100));
					$input.siblings('.custom-slider-handle').css('left', percent + '%');

					// Also update the input value to the clamped value
					$input.val(clampedValue);

					// Update gradient
					const mode = $input.data('mode');
					const gradient = generateGradient(mode, name, values);
					$input.css('background', gradient);
				}
			}
		});

	}

	function positionPicker(instance) {
        const $replacer = instance.$replacer;
        const $container = instance.$container;
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        const scrollTop = $(window).scrollTop();
        const scrollLeft = $(window).scrollLeft();
        const pickerWidth = $container.outerWidth();
        const pickerHeight = $container.outerHeight();
        let top;
        let left;

        if (instance.opts.positionMode === 'center') {
            top = scrollTop + Math.max(10, Math.round((windowHeight - pickerHeight) / 2));
            left = scrollLeft + Math.max(10, Math.round((windowWidth - pickerWidth) / 2));
        } else {
            const $anchor = instance.opts.anchor || $replacer || instance.$input;
            const offset = $anchor.offset() || { top: 0, left: 0 };
            top = offset.top + $anchor.outerHeight() + 5;
            left = offset.left;
            if (left + pickerWidth > scrollLeft + windowWidth) {
                left = scrollLeft + windowWidth - pickerWidth - 10;
            }
            if (top + pickerHeight > scrollTop + windowHeight) {
                top = offset.top - pickerHeight - 5;
            }
        }

        $container.css({
            position: 'absolute',
            top: top,
            left: left,
            zIndex: 9999995
        });
	}

	function showPicker(instance) {
		instance.isOpen = true;
		instance.originalColor = new ColorObject(instance.currentColor.toRgbString());
		instance.$container.addClass('sp-active');
		positionPicker(instance);

		// Ensure picker reflects current swatch state when opening
		// If current swatch is "No Color" (alpha = 0), initialize sliders with alpha 0
		if (instance.opts.allowEmpty && instance.currentColor && (instance.currentColor.a === 0)) {
			instance.currentValues = rgbToAllModes(
				instance.currentColor.r,
				instance.currentColor.g,
				instance.currentColor.b,
				0,
				instance.currentValues
			);
		}

		// Rebuild sliders for the active mode with current values and update UI
		updateColorModePickers(instance);
		updatePickerFromColor(instance);

		if (instance.opts.beforeShow) {
			instance.opts.beforeShow();
		}
	}

	function hidePicker(instance) {
		instance.isOpen = false;
		instance.$container.removeClass('sp-active');
	}

})(jQuery, window.culori);
