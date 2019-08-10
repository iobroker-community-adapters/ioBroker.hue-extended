module.exports =
{
	"datetime": {"description": "Datetime of last update", "role": "text", "type": "string", "device": false},
	"timestamp": {"description": "Timestamp of last update", "role": "text", "type": "string", "device": false},
	
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
	
	"lights.state.alert": {"description": "The alert effect,is a temporary change to the bulb’s state", "role": "switch", "type": "string", "common": {"states": {"none": "No alert", "select": "One breathe cycle", "lselect": "Breathe cycles for 15s"}}},
	"lights.state.bri": {"description": "Brightness of the light", "role": "level.dimmer", "type": "number"},
	"lights.state.colormode": {"description": "Indicates the color mode in which the light is working", "role": "indicator.colormode", "type": "string"},
	"lights.state.ct": {"description": "The Mired Color temperature of the light", "role": "level.color.temperature", "type": "number"},
	"lights.state.effect": {"description": "The dynamic effect of the light", "role": "switch", "type": "string", "common": {"states": {"none": "No effect", "colorloop": "Cycle through all hues"}}},
	"lights.state.transitiontime": {"description": "The duration of the transition from the light’s current state to the new state. This is given as a multiple of 100ms and defaults to 4 (400ms).", "role": "value", "type": "number"},
	"lights.state.hue": {"description": "Hue of the light between 0 and 65535", "role": "level.color.hue", "type": "number"},
	"lights.state.hue_degrees": {"description": "Hue of the light between 0° and 360°", "role": "level.color.hue", "type": "number"},
	"lights.state.level": {"description": "Level of the light between 0 and 100", "role": "level.dimmer", "type": "number"},
	"lights.state.mode": {"description": "Mode of the light", "role": "text", "type": "string"},
	"lights.state.on": {"description": "Switch light on / off", "role": "switch.light", "type": "boolean"},
	"lights.state.reachable": {"description": "Indicates if light can be reached by the bridge", "role": "indicator.reachable", "type": "boolean"},
	"lights.state.sat": {"description": "Saturation of the light", "role": "level.color.saturation", "type": "number"},
	"lights.state.xy": {"description": "The x and y coordinates in CIE color space", "role": "level.color.xy", "type": "string", "convert": "string"},
	
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
	"groups.action.alert": {"description": "The alert effect,is a temporary change to the bulb’s state", "role": "switch", "type": "string", "common": {"states": {"none": "No alert", "select": "One breathe cycle", "lselect": "Breathe cycles for 15s"}}},
	"groups.action.bri": {"description": "Brightness of the light", "role": "level.dimmer", "type": "number"},
	"groups.action.colormode": {"description": "Indicates the color mode in which the light is working", "role": "indicator.colormode", "type": "string"},
	"groups.action.ct": {"description": "The Mired Color temperature of the light", "role": "level.color.temperature", "type": "number"},
	"groups.action.effect": {"description": "The dynamic effect of the light", "role": "switch", "type": "string", "common": {"states": {"none": "No effect", "colorloop": "Cycle through all hues"}}},
	"groups.action.transitiontime": {"description": "The duration of the transition from the light’s current state to the new state. This is given as a multiple of 100ms and defaults to 4 (400ms).", "role": "value", "type": "number"},
	"groups.action.hue": {"description": "Hue of the light between 0 and 65535", "role": "level.color.hue", "type": "number"},
	"groups.action.hue_degrees": {"description": "Hue of the light between 0° and 360°", "role": "level.color.hue", "type": "number"},
	"groups.action.level": {"description": "Level of the light between 0 and 100", "role": "level.dimmer", "type": "number"},
	"groups.action.on": {"description": "Switch light on / off", "role": "switch.light", "type": "boolean"},
	"groups.action.sat": {"description": "Saturation of the light", "role": "level.color.saturation", "type": "number"},
	"groups.action.xy": {"description": "The x and y coordinates in CIE color space", "role": "level.color.xy", "type": "string", "convert": "string"},
	
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
	"sensors.swversion": {"description": "Software version ", "role": "text", "type": "string"},
	"sensors.type": {"description": "", "role": "text", "type": "string"},
	"sensors.uid": {"description": "Unique ID of the sensor", "role": "value", "type": "number"},
	"sensors.uniqueid": {"description": "Unique ID of the sensor", "role": "text", "type": "string"}
}
