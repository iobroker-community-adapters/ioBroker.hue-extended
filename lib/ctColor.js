/*
 * Source: http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
 * by http://www.tannerhelland.com/author/thelland/
 * September 17, 2012
 *
 */
"use strict";

function getRGBfromTemperature(ct)
{
	ct /= 100;
	let rgb = [
		// RED
		Math.round(ct <= 66 ? 255 : 329.698727446 * Math.pow((ct - 60), -0.1332047592)),
		
		// GREEN
		Math.round(ct <= 66 ? 99.4708025861 * Math.log(ct) - 161.1195681661 : 288.1221695283 * Math.pow((ct - 60), -0.0755148492)),
		
		// BLUE
		Math.round(ct >= 66 ? 255 : (ct <= 19 ? 0 : 138.5177312231 * Math.log(ct - 10) - 305.0447927307))
	];
	
	return rgb.map(val => Math.max(Math.min(val, 255), 0));
}

module.exports = {
    convertCTtoRGB: getRGBfromTemperature
};