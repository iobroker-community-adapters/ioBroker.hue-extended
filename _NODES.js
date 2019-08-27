module.exports =
{
	"datetime": {"description": "Datetime of last update", "role": "text", "type": "string", "device": false},
	"timestamp": {"description": "Timestamp of last update", "role": "text", "type": "string", "device": false},
	
	// ACTIONS
	"on": {"description": "Switch light on / off", "role": "switch.light", "type": "boolean"},
	"bri": {"description": "Brightness of the light between 0 and 254", "role": "level.dimmer", "type": "number"},
	"hue": {"description": "Hue of the light between 0 and 65535", "role": "level.color.hue", "type": "number"},
	"hue_degrees": {"description": "Hue of the light between 0° and 360°", "role": "level.color.hue", "type": "number"},
	"sat": {"description": "Saturation of the light between 0 and 254", "role": "level.color.saturation", "type": "number"},
	"xy": {"description": "The x and y coordinates in CIE color space", "role": "level.color.xy", "type": "string", "convert": "string"},
	"ct": {"description": "The Mired Color temperature of the light", "role": "level.color.temperature", "type": "number"},
	"alert": {"description": "The alert effect,is a temporary change to the bulb’s state", "role": "switch", "type": "string", "common": {"states": {"none": "No alert", "select": "One breathe cycle", "lselect": "Breathe cycles for 15s"}}},
	"effect": {"description": "The dynamic effect of the light", "role": "switch", "type": "string", "common": {"states": {"none": "No effect", "colorloop": "Cycle through all hues"}}},
	"transitiontime": {"description": "The duration of the transition from the light’s current state to the new state. This is given as a multiple of 100ms and defaults to 4 (400ms).", "role": "value", "type": "number"},
	"colormode": {"description": "Indicates the color mode in which the light is working", "role": "indicator.colormode", "type": "string"},
	"level": {"description": "Level of the light between 0% and 100%", "role": "level.dimmer", "type": "number"},
	"scene": {"description": "Apply scene on light or group", "role": "switch.scene", "type": "string"},
	"trigger": {"description": "Trigger scene on light or group", "role": "button", "type": "boolean"},
	"_rgb": {"description": "RGB (red, green, blue) color space", "role": "level.color.rgb", "type": "string"},
	"_hsv": {"description": "HSV (hue, saturation, value / brightness) color space", "role": "level.color.hsv", "type": "string"},
	"_cmyk": {"description": "CMYK (cyan, magenta, yellow and key / black) color space", "role": "level.color.cmyk", "type": "string"},
	"_xyz": {"description": "XYZ / CIE color space", "role": "level.color.xyz", "type": "string"},
	"_hex": {"description": "Hex representation of the color", "role": "level.color.hex", "type": "string"},
	"_commands": {"description": "Apply multiple commands on the device", "role": "switch", "type": "string"},
	
	
	// LIGHTS
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
	"groups.state.all_on": {"description": "Indicates if all lights of the group are turned on", "role": "indicator", "type": "boolean"},
	"groups.state.any_on": {"description": "Indicates if any light of the group is turned on", "role": "indicator", "type": "boolean"},
	
	"groups.class": {"description": "Category of Room types", "role": "text", "type": "string"},
	"groups.name": {"description": "A unique, editable name given to the group.", "role": "text", "type": "string"},
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
	"sensors.recycle": {"description": "Resource is automatically deleted when not referenced anymore", "role": "indicator", "type": "boolean"},
	"sensors.swversion": {"description": "Software version", "role": "text", "type": "string"},
	"sensors.type": {"description": "", "role": "text", "type": "string"},
	"sensors.uid": {"description": "Unique ID of the sensor", "role": "value", "type": "number"},
	"sensors.uniqueid": {"description": "Unique ID of the sensor", "role": "text", "type": "string"},
	
	// SCENES
	"scenes.appdata.data": {"description": "App specific data (free format string)", "role": "text", "type": "string"},
	"scenes.appdata.version": {"description": "App specific version of the data field", "role": "value", "type": "number"},
	"scenes.group": {"description": "Group ID that a scene is linked to", "role": "value", "type": "number"},
	"scenes.lastupdated": {"description": "UTC time the scene has been created or has been updated by a PUT", "role": "text", "type": "string"},
	"scenes.locked": {"description": "Indicates that the scene is locked by a rule or a schedule and cannot be deleted until all resources requiring or that reference the scene are deleted.", "role": "indicator", "type": "boolean"},
	"scenes.name": {"description": "Human readable name of the scene.", "role": "text", "type": "string"},
	"scenes.owner": {"description": "Whitelist user that created or modified the content of the scene", "role": "text", "type": "string"},
	"scenes.picture": {"description": "Individual scene picture", "role": "text", "type": "string"},
	"scenes.recycle": {"description": "Indicates whether the scene can be automatically deleted by the bridge", "role": "indicator", "type": "boolean"},
	"scenes.type": {"description": "Type of the scene (LightScene or GroupScene)", "role": "text", "type": "string"},
	"scenes.uid": {"description": "The id of the scene being modified or created.", "role": "text", "type": "string"},
	"scenes.version": {"description": "Version of scene document (lightstates will be empty or available)", "role": "value", "type": "number", "common": {"states": {1: "Scene created via PUT, lightstates will be empty", 2: "Scene created via POST lightstates available"}}}
}
