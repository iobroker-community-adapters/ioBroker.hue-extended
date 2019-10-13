module.exports =
{
	// remap states for standardization (see https://github.com/Zefau/ioBroker.hue-extended/issues/1 and https://forum.iobroker.net/post/298019)
	"MAPPING":
	{
		"ct": "colorTemperature",
		"bri": "brightness",
		"sat": "saturation"
	},
	
	// all adapter states
	"STATES":
	{
		"lastSeen": {"description": "Datetime of last update", "role": "text", "type": "string", "device": false},
		"datetime": {"description": "Datetime of last update", "role": "text", "type": "string", "device": false},
		"timestamp": {"description": "Timestamp of last update", "role": "value", "type": "number", "device": false},
		"syncing": {"description": "Indicates whether object tree will be synchronized", "role": "indicator", "type": "boolean", "device": false},
		"info.lastAction.datetime": {"description": "Datetime of last action applied", "role": "text", "type": "string"},
		"info.lastAction.timestamp": {"description": "Timestamp of last action applied", "role": "value", "type": "number"},
		"info.lastAction.lastCommand": {"description": "Last action applied to any device", "role": "text", "type": "string"},
		"info.lastAction.lastResult": {"description": "Last result of last action applied", "role": "text", "type": "string"},
		"info.lastAction.error": {"description": "Indicates if error occured on last action", "role": "indicator", "type": "boolean"},
		
		// ACTIONS
		"on": {"description": "Switch light on / off", "role": "switch.light", "type": "boolean"},
		"brightness": {"description": "Brightness of the light between 0 and 254", "role": "level.color.brightness", "type": "number", "common": { "min": 0, "max": 254 }},
		"level": {"description": "Level of the light between 0% and 100%", "role": "level.dimmer", "type": "number", "common": { "min": 0, "max": 100, "unit": "%" }},
		//"hue": {"description": "Hue of the light between 0 and 65535", "role": "level.color.hue", "type": "number", "common": { "min": 0, "max": 65535 }},
		"hue": {"description": "Hue of the light between 0° and 360°", "role": "level.color.hue", "type": "number", "common": { "min": 0, "max": 360, "unit": "°" }},
		"saturation": {"description": "Saturation of the light between 0 and 254", "role": "level.color.saturation", "type": "number", "common": { "min": 0, "max": 254 }},
		"xy": {"description": "The x and y coordinates in CIE color space", "role": "level.color.xy", "type": "string"},
		"colorTemperature": {"description": "The temperature of the light between 2000°K and 6500°K", "role": "level.color.temperature", "type": "number", "common": { "min": 2000, "max": 6500, "unit": "°K" }}, // API min is 153, max is 500 
		"alert": {"description": "The alert effect,is a temporary change to the bulb’s state", "role": "switch", "type": "string", "common": {"states": {"none": "No alert", "select": "One breathe cycle", "lselect": "Breathe cycles for 15s"}}},
		"effect": {"description": "The dynamic effect of the light", "role": "switch", "type": "string", "common": {"states": {"none": "No effect", "colorloop": "Cycle through all hues"}}},
		"transitiontime": {"description": "The duration of the transition from the light’s current state to the new state. This is given as a multiple of 100ms and defaults to 4 (400ms).", "role": "switch", "type": "number"},
		"colormode": {"description": "Indicates the color mode in which the light is working", "role": "indicator.colormode", "type": "string"},
		"scene": {"description": "Apply scene on light or group", "role": "switch.scene", "type": "string"},
		"trigger": {"description": "Trigger scene on light or group", "role": "button", "type": "boolean"},
		"options": {"description": "Options for action trigger", "role": "json", "type": "string"},
		"rgb": {"description": "RGB (red, green, blue) color space", "role": "level.color.rgb", "type": "string"},
		"hsv": {"description": "HSV (hue, saturation, value / brightness) color space", "role": "level.color.hsv", "type": "string"},
		"cmyk": {"description": "CMYK (cyan, magenta, yellow and key / black) color space", "role": "level.color.cmyk", "type": "string"},
		"xyz": {"description": "XYZ / CIE color space", "role": "level.color.xyz", "type": "string"},
		"hex": {"description": "Hex representation of the color", "role": "level.color.hex", "type": "string"},
		"_commands": {"description": "Apply multiple commands on the device", "role": "switch", "type": "string"},
		
		
		// LIGHTS
		"lights.action.lastAction.datetime": {"description": "Datetime of last action applied", "role": "text", "type": "string"},
		"lights.action.lastAction.timestamp": {"description": "Timestamp of last action applied", "role": "value", "type": "number"},
		"lights.action.lastAction.lastCommand": {"description": "Last action applied to light", "role": "text", "type": "string"},
		"lights.action.lastAction.lastResult": {"description": "Last result of last action applied", "role": "text", "type": "string"},
		"lights.action.lastAction.error": {"description": "Indicates if error occured on last action", "role": "indicator", "type": "boolean"},
		
		"lights.capabilities.control.ct.max": {"description": "", "role": "value", "type": "number"},
		"lights.capabilities.control.ct.min": {"description": "", "role": "value", "type": "number"},
		"lights.capabilities.control.colorgamuttype": {"description": "", "role": "text", "type": "string"},
		"lights.capabilities.control.maxlumen": {"description": "", "role": "value", "type": "number"},
		"lights.capabilities.control.mindimlevel": {"description": "", "role": "value", "type": "number"},
		"lights.capabilities.streaming.proxy": {"description": "Indicates if lamp can be used for entertainment streaming as a proxy node", "role": "indicator", "type": "boolean"},
		"lights.capabilities.streaming.renderer": {"description": "Indicates if lamp can be used for entertainment streaming as renderer", "role": "indicator", "type": "boolean"},
		"lights.capabilities.certified": {"description": "Indicates if lamp is official Philips", "role": "indicator", "type": "boolean"},
		
		"lights.config.startup.configured": {"description": "", "role": "indicator", "type": "boolean"},
		"lights.config.startup.mode": {"description": "", "role": "text", "type": "string"},
		"lights.config.archetype": {"description": "", "role": "text", "type": "string"},
		"lights.config.direction": {"description": "", "role": "text", "type": "string"},
		"lights.config.function": {"description": "", "role": "text", "type": "string"},
		
		"lights.state.mode": {"description": "Mode of the light", "role": "text", "type": "string"},
		"lights.state.reachable": {"description": "Indicates if light can be reached by the bridge", "role": "indicator.reachable", "type": "boolean"},
		
		"lights.swupdate.lastinstall": {"description": "Time of last software update", "role": "text", "type": "string"},
		"lights.swupdate.state": {"description": "State of software update for the system", "role": "text", "type": "string"},
		
		"lights.manufacturername": {"description": "The manufacturer name", "role": "text", "type": "string"},
		"lights.modelid": {"description": "The hardware model of the light", "role": "text", "type": "string"},
		"lights.name": {"description": "A unique, editable name given to the light", "role": "text", "type": "string"},
		"lights.productid": {"description": "Product ID", "role": "text", "type": "string"},
		"lights.productname": {"description": "Product Name", "role": "text", "type": "string"},
		"lights.swconfigid": {"description": "Software configuration ID", "role": "text", "type": "string"},
		"lights.swversion": {"description": "Software version", "role": "text", "type": "string"},
		"lights.type": {"description": "A fixed name describing the type of light", "role": "text", "type": "string"},
		"lights.uid": {"description": "Unique ID of the light", "role": "value", "type": "number"},
		"lights.uniqueid": {"description": "Unique ID of the device. The MAC address of the device with a unique endpoint id", "role": "text", "type": "string"},
		
		
		// GROUPS
		"groups.action.lastAction.datetime": {"description": "Datetime of last action applied", "role": "text", "type": "string"},
		"groups.action.lastAction.timestamp": {"description": "Timestamp of last action applied", "role": "value", "type": "number"},
		"groups.action.lastAction.lastCommand": {"description": "Last action applied to group", "role": "text", "type": "string"},
		"groups.action.lastAction.lastResult": {"description": "Last result of last action applied", "role": "text", "type": "string"},
		"groups.action.lastAction.error": {"description": "Indicates if error occured on last action", "role": "indicator", "type": "boolean"},
		
		"groups.state.all_on": {"description": "Indicates if all lights of the group are turned on", "role": "indicator", "type": "boolean"},
		"groups.state.any_on": {"description": "Indicates if any light of the group is turned on", "role": "indicator", "type": "boolean"},
		
		"groups.class": {"description": "Category of Room types", "role": "text", "type": "string"},
		"groups.lights": {"description": "Lights assigned to the group", "role": "text", "type": "string"},
		"groups.sensors": {"description": "Sensors assigned to the group", "role": "text", "type": "string"},
		"groups.name": {"description": "A unique, editable name given to the group", "role": "text", "type": "string"},
		"groups.recycle": {"description": "Resource is automatically deleted when not referenced anymore", "role": "indicator", "type": "boolean"},
		"groups.type": {"description": "Type of group", "role": "text", "type": "string"},
		"groups.uid": {"description": "Unique ID of the group", "role": "value", "type": "number"},
		
		// SENSORS
		"sensors.capabilities.certified": {"description": "Indicates if lamp is official Philips", "role": "indicator", "type": "boolean"},
		"sensors.capabilities.primary": {"description": "", "role": "indicator", "type": "boolean"},
		
		"sensors.config.battery": {"description": "Current battery level", "role": "value.battery", "type": "number"},
		"sensors.config.configured": {"description": "", "role": "indicator", "type": "boolean"},
		"sensors.config.reachable": {"description": "Indicates if sensor can be reached by the bridge", "role": "indicator.reachable", "type": "boolean"},
		"sensors.config.on": {"description": "", "role": "indicator", "type": "boolean"},
		"sensors.config.sunriseoffset": {"description": "", "role": "value", "type": "number"},
		"sensors.config.sunsetoffset": {"description": "", "role": "value", "type": "number"},
		
		"sensors.state.buttonevent": {"description": "Event of the button", "role": "value", "type": "number"},
		"sensors.state.flag": {"description": "Flag", "role": "indicator", "type": "boolean"},
		"sensors.state.temperature": {"description": "Temperature", "role": "value.temperature", "type": "number", "common": {"unit": "°C"}, "convert": "temperature"},
		"sensors.state.daylight": {"description": "Indicates daylight", "role": "indicator", "type": "boolean"},
		"sensors.state.status": {"description": "Status", "role": "value", "type": "number"},
		"sensors.state.lastupdated": {"description": "Last update", "role": "text", "type": "string"},
		
		"sensors.swupdate.lastinstall": {"description": "Time of last software update", "role": "text", "type": "string"},
		"sensors.swupdate.state": {"description": "State of software update for the system", "role": "text", "type": "string"},
		
		"sensors.manufacturername": {"description": "The manufacturer name", "role": "text", "type": "string"},
		"sensors.modelid": {"description": "The hardware model of the sensor", "role": "text", "type": "string"},
		"sensors.name": {"description": "A unique, editable name given to the sensor", "role": "text", "type": "string"},
		"sensors.productname": {"description": "Product name of the sensor", "role": "text", "type": "string"},
		"sensors.recycle": {"description": "Resource is automatically deleted when not referenced anymore", "role": "indicator", "type": "boolean"},
		"sensors.swversion": {"description": "Software version", "role": "text", "type": "string"},
		"sensors.type": {"description": "", "role": "text", "type": "string"},
		"sensors.uid": {"description": "Unique ID of the sensor", "role": "value", "type": "number"},
		"sensors.diversityid": {"description": "Unique ID of the sensor", "role": "text", "type": "string"},
		"sensors.uniqueid": {"description": "Unique ID of the sensor", "role": "text", "type": "string"},
		
		// SCENES
		"scenes.appdata.data": {"description": "App specific data (free format string)", "role": "text", "type": "string"},
		"scenes.appdata.version": {"description": "App specific version of the data field", "role": "value", "type": "number"},
		"scenes.group": {"description": "Group ID that a scene is linked to", "role": "value", "type": "number"},
		"scenes.lastupdated": {"description": "UTC time the scene has been created or has been updated by a PUT", "role": "text", "type": "string"},
		"scenes.locked": {"description": "Indicates that the scene is locked by a rule or a schedule and cannot be deleted until all resources requiring or that reference the scene are deleted", "role": "indicator", "type": "boolean"},
		"scenes.name": {"description": "Human readable name of the scene", "role": "text", "type": "string"},
		"scenes.owner": {"description": "Whitelist user that created or modified the content of the scene", "role": "text", "type": "string"},
		"scenes.picture": {"description": "Individual scene picture", "role": "text", "type": "string"},
		"scenes.recycle": {"description": "Indicates whether the scene can be automatically deleted by the bridge", "role": "indicator", "type": "boolean"},
		"scenes.type": {"description": "Type of the scene (LightScene or GroupScene)", "role": "text", "type": "string"},
		"scenes.uid": {"description": "The id of the scene being modified or created", "role": "text", "type": "string"},
		"scenes.version": {"description": "Version of scene document (lightstates will be empty or available)", "role": "value", "type": "number", "common": {"states": {1: "Scene created via PUT, lightstates will be empty", 2: "Scene created via POST lightstates available"}}},

		// SCHEDULES
		"schedules.created": {"description": "The creation date of the schedule", "role": "text", "type": "string"},
		"schedules.description": {"description": "The description of the schedule", "role": "text", "type": "string"},
		"schedules.localtime": {"description": "The local tie of the schedule", "role": "text", "type": "string"},
		"schedules.name": {"description": "Human readable name of the schedule", "role": "text", "type": "string"},
		"schedules.recycle": {"description": "Indicates whether the schedule can be automatically deleted by the bridge", "role": "indicator", "type": "boolean"},
		"schedules.status": {"description": "The status of the schedule", "role": "indicator", "type": "boolean"},
		"schedules.time": {"description": "The time of the schedule", "role": "text", "type": "string"},
		"schedules.uid": {"description": "The id of the schedule being modified or created", "role": "text", "type": "string"}
	},
	
	// action states (these states the adapter will subscribe)
	// https://developers.meethue.com/develop/hue-api/lights-api/#142_response
	"SUBSCRIPTIONS":
	[
		/*
		 * On/Off state of the light. On=true, Off=false
		 */
		'on',
		
		/*
		 * Brightness of the light. This is a scale from the minimum brightness the light is capable of, 1, to the maximum capable brightness, 254.
		 */
		//'bri',
		'brightness',
		
		/*
		 * Hue of the light.
		 * This is a wrapping value between 0 and 65535. Note, that hue/sat values are hardware dependent which means that programming two devices with the same value does not garantuee that they will be the same color.
		 * Programming 0 and 65535 would mean that the light will resemble the color red, 21845 for green and 43690 for blue.
		 */
		'hue',
		
		/*
		 * Saturation of the light. 254 is the most saturated (colored) and 0 is the least saturated (white).
		 */
		//'sat',
		'saturation',
		
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
		//'ct',
		'colorTemperature',
		
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
		 * Commands
		 */
		'_commands',
		
		/*
		 * Color spaces
		 */
		'rgb',
		'hsv',
		//'cmyk',
		//'xyz',
		'hex'
	]
}
