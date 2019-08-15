/*
 * https://developers.meethue.com/develop/hue-api/lights-api/#142_response
 */
module.exports =
[
	/*
	 * On/Off state of the light. On=true, Off=false
	 */
	'on',
	
	/*
	 * Brightness of the light. This is a scale from the minimum brightness the light is capable of, 1, to the maximum capable brightness, 254.
	 */
	'bri',
	
	/*
	 * Hue of the light.
	 * This is a wrapping value between 0 and 65535. Note, that hue/sat values are hardware dependent which means that programming two devices with the same value does not garantuee that they will be the same color.
	 * Programming 0 and 65535 would mean that the light will resemble the color red, 21845 for green and 43690 for blue.
	 */
	'hue',
	'hue_degrees',
	
	/*
	 * Saturation of the light. 254 is the most saturated (colored) and 0 is the least saturated (white).
	 */
	'sat',
	
	/*
	 * The x and y coordinates of a color in CIE color space.
	 * The first entry is the x coordinate and the second entry is the y coordinate. Both x and y are between 0 and 1.
	 * Using CIE xy, the colors can be the same on all lamps if the coordinates are within every lamps gamuts (example: “xy”:[0.409,0.5179] is the same color on all lamps).
	 * If not, the lamp will calculate it’s closest color and use that. The CIE xy color is absolute, independent from the hardware.
	 */
	'xy',
	
	/*
	 * The Mired Color temperature of the light. 2012 connected lights are capable of 153 (6500K) to 500 (2000K).
	 */
	'ct',
	
	/*
	 * The alert effect, which is a temporary change to the bulb’s state. This can take one of the following values:
	 *		“none” – The light is not performing an alert effect.
	 *		“select” – The light is performing one breathe cycle.
	 *		“lselect” – The light is performing breathe cycles for 15 seconds or until an "alert": "none" command is received.Note that this contains the last alert sent to the light and not its current state. i.e. After the breathe cycle has finished the bridge does not reset the alert to “none“.
	 */
	'alert',
	
	/*
	 * The dynamic effect of the light, can either be “none” or “colorloop”.If set to colorloop, the light will cycle through all hues using the current brightness and saturation settings.
	 */
	'effect',
	
	/*
	 * The duration of the transition from the light’s current state to the new state. This is given as a multiple of 100ms and defaults to 4 (400ms). For example, setting transitiontime:10 will make the transition last 1 second.
	 */
	'transitiontime', 
	
	/*
	 * Indicates the color mode in which the light is working, this is the last command type it received.
	 * Values are “hs” for Hue and Saturation, “xy” for XY and “ct” for Color Temperature. This parameter is only present when the light supports at least one of the values.
	 */
	'colormode',
	
	/*
	 * Level
	 */
	'level',
	
	/*
	 * Scene
	 */
	'scene',
	'trigger',
	
	/*
	 * Color spaces
	 */
	'_rgb',
	'_hsv',
	'_cmyk',
	'_xyz',
	'_hex'
];