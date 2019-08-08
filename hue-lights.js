'use strict';
const adapterName = require('./io-package.json').common.name;
const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const _request = require('request-promise');


/*
 * internal libraries
 */
const Library = require(__dirname + '/lib/library.js');
const _NODES = require(__dirname + '/NODES.json');


/*
 * constants & variables initiation
 */
let adapter;
let library;
let unloaded;
let bridge, dutyCycle, refreshCycle;

const SUBSCRIPTIONS = [ // https://developers.meethue.com/develop/hue-api/lights-api/#142_response
	'on', // On/Off state of the light. On=true, Off=false
	'bri', // Brightness of the light. This is a scale from the minimum brightness the light is capable of, 1, to the maximum capable brightness, 254.
	'hue', // Hue of the light. This is a wrapping value between 0 and 65535. Note, that hue/sat values are hardware dependent which means that programming two devices with the same value does not garantuee that they will be the same color. Programming 0 and 65535 would mean that the light will resemble the color red, 21845 for green and 43690 for blue.
	'sat', // Saturation of the light. 254 is the most saturated (colored) and 0 is the least saturated (white).
	'xy', // The x and y coordinates of a color in CIE color space.
				/*
				The first entry is the x coordinate and the second entry is the y coordinate. Both x and y are between 0 and 1. Using CIE xy, the colors can be the same on all lamps if the coordinates are within every lamps gamuts (example: “xy”:[0.409,0.5179] is the same color on all lamps). If not, the lamp will calculate it’s closest color and use that. The CIE xy color is absolute, independent from the hardware.
				*/
	'ct', // The Mired Color temperature of the light. 2012 connected lights are capable of 153 (6500K) to 500 (2000K).
	'alert', // The alert effect, which is a temporary change to the bulb’s state. This can take one of the following values:
				/*
				“none” – The light is not performing an alert effect.
				“select” – The light is performing one breathe cycle.
				“lselect” – The light is performing breathe cycles for 15 seconds or until an "alert": "none" command is received.Note that this contains the last alert sent to the light and not its current state. i.e. After the breathe cycle has finished the bridge does not reset the alert to “none“.
				*/
	'effect', // The dynamic effect of the light, can either be “none” or “colorloop”.If set to colorloop, the light will cycle through all hues using the current brightness and saturation settings.
	'transitiontime', // The duration of the transition from the light’s current state to the new state. This is given as a multiple of 100ms and defaults to 4 (400ms). For example, setting transitiontime:10 will make the transition last 1 second.
	// 'colormode', // Indicates the color mode in which the light is working, this is the last command type it received. Values are “hs” for Hue and Saturation, “xy” for XY and “ct” for Color Temperature. This parameter is only present when the light supports at least one of the values.
	'level'
];

let device;
let DEVICES = {
	'groups': {},
	'lights': {},
	'resourcelinks': {},
	'rules': {},
	'scenes': {},
	'schedules': {},
	'sensors': {}
};


/*
 * ADAPTER
 *
 */
function startAdapter(options)
{
	options = options || {};
	Object.assign(options,
	{
		name: adapterName
	});
	
	adapter = new utils.Adapter(options);
	library = new Library(adapter);
	unloaded = false;
	
	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', function()
	{
		if (!adapter.config.ip || !adapter.config.user)
			return library.terminate('Please provide connection settings for Hue Bridge!');
		
		// Bridge connection
		bridge = 'http://' + adapter.config.ip + ':' + (adapter.config.port || 80) + '/api/' + adapter.config.user + '/';
		
		// retrieve from Bridge
		['config', 'groups', 'lights', 'resourcelinks', 'rules', 'scenes', 'schedules', 'sensors'].forEach(function(channel)
		{
			if (adapter.config['sync' + library.ucFirst(channel)])
			{
				adapter.log.info('Retrieving ' + channel + ' from Hue Bridge...');
				getBridgeData(channel, adapter.config.refresh);
			}
		});
		
		// delete old states (which were not updated recently)
		clearTimeout(dutyCycle);
		dutyCycle = setTimeout(function dutyCycleRun()
		{
			adapter.log.debug('Running Duty Cycle...');
			library.runDutyCycle(adapterName + '.' + adapter.instance, Math.floor(Date.now()/1000));
			adapter.log.debug('Duty Cycle finished.');
			dutyCycle = setTimeout(dutyCycleRun, 4*60*60*1000);
			
		}, 60*1000);
	});

	/*
	 * STATE CHANGE
	 *
	 */
	adapter.on('stateChange', function(id, state)
	{
		if (state === undefined || state === null || state.ack === true || state.val === undefined || state.val === null) return;
		adapter.log.debug('State of ' + id + ' has changed ' + JSON.stringify(state) + '.');
		
		// get params
		let params = id.replace(adapterName + '.' + adapter.instance + '.', '').split('.');
		let type = params.splice(0,1);
		let deviceId = params.splice(0,1);
		
		let name = getDeviceState([type, deviceId, 'name']);
		let uid = getDeviceState([type, deviceId, 'uid']);
		let path = type + '/' + uid + '/state';
		let action = params[params.length-1];
		
		if (!uid)
		{
			return false;
		}
		
		// build command
		let commands = { [action]: state.val };
		
		// if device is turned on, make sure brightness is not 0
		if (action == 'on' && state.val == true)
		{
			let bri = getDeviceState([type, deviceId, 'state.bri']) || getDeviceState([type, deviceId, 'action.bri']);
			commands.bri = bri == 0 ? 254 : bri;
		}
		
		// if device is turned off, set level / bri to 0
		/*
		if (action == 'on' && state.val == false)
			commands.bri = 0;
		*/
		
		// if .level is changed the change will be applied to .bri instead
		if (action == 'level')
			commands = { on: true, bri: Math.ceil(254 * state.val / 100) };
		
		// if .bri is changed, make sure light is on
		if (action == 'bri')
			commands = { on: true, bri: state.val };
		
		// if .bri is changed to 0, turn off
		if ((action == 'bri' || action == 'level') && state.val < 1)
			commands = { on: false, bri: 0 };
		
		// apply command
		sendCommand({ name: name, trigger: path }, commands);
	});
	
	/*
	 * ADAPTER UNLOAD
	 *
	 */
	adapter.on('unload', function(callback)
	{
		try
		{
			adapter.log.info('Adapter stopped und unloaded.');
			unloaded = true;
			clearTimeout(refreshCycle);
			clearTimeout(dutyCycle);
			
			callback();
		}
		catch(e)
		{
			callback();
		}
	});

	return adapter;	
};


/*
 * COMPACT MODE
 * If started as allInOne/compact mode => returnfunction to create instance
 *
 */
if (module && module.parent)
	module.exports = startAdapter;
else
	startAdapter(); // or start the instance directly


/**
 *
 */
function getBridgeData(channel, refresh)
{
	_request({ uri: bridge + channel + '/', json: true }).then(function(res)
	{
		if (!res || (res[0] && res[0].error))
		{
			adapter.log.error('Error retrieving ' + channel + ' from Hue Bridge' + (res[0] && res[0].error ? ': ' + res[0].error.description : '!'));
			return false;
		}
		
		// add meta data
		res.timestamp = Math.floor(Date.now()/1000);
		res.datetime = library.getDateTime(Date.now());
		
		// write data to states
		addBridgeData({ [channel]: res });
		
		// refresh interval
		if (refresh > 0 && refresh < 10)
		{
			adapter.log.warn('Refresh rate should not be less than 10s, thus set to 10s.');
			refresh = 10;
		}
		
		if (refresh && !unloaded)
			refreshCycle = setTimeout(getBridgeData, refresh*1000, channel, refresh);
		
	}).catch(function(err)
	{
		library.terminate('Error connecting to Hue Bridge when retrieving channel ' + channel + ' (' + err.message + ')!');
		adapter.log.debug(err.message);
	});
}

/**
 *
 */
function addBridgeData(data)
{
	adapter.log.debug('Refreshing ' + Object.keys(data) + ' (' + JSON.stringify(data) + ').');
	
	// add meta data
	data.timestamp = Math.floor(Date.now()/1000);
	data.datetime = library.getDateTime(Date.now());
	
	for (let key in data)
	{
		// loop through payload
		device = null;
		readData(key, data[key]);
	}
}

/**
 *
 */
function readData(key, data)
{
	// only proceed if data is given
	if (data === undefined || data === 'undefined')
		return false;
	
	// set current device name
	if (data && data.name)
		device = data.name;
	
	// get node details
	let node = get(key.split('.')); // lights.<NAME/ID>.folder
	
	// loop nested data
	if (data !== null && typeof data == 'object' && key.substr(-2) != 'xy')
	{
		// create channel
		if (Object.keys(data).length > 0)
		{
			// use name instead of uid
			let id = false;
			if (data.name && key != 'config')
			{
				data.uid = key.substr(key.lastIndexOf('.')+1);
				id = data.name.toLowerCase().replace(/ /g, '_');
				key = key.replace('.' + data.uid, '.' + data.uid + '-' + id);
			}
			
			// add level as additional state
			if (data.bri !== undefined)
			{
				data.level = data.bri > 0 ? Math.ceil(data.bri / 254 * 100) : 0;
				data.transitiontime = data.transitiontime || 4;
			}
			
			// create channel
			library.set({
				node: key,
				role: 'channel',
				description: id || RegExp('\.[0-9]{1-3}$').test(key.substr(-4)) ? data.name : library.ucFirst(key.substr(key.lastIndexOf('.')+1))
			});
		
			// read nested data
			for (let nestedKey in data)
				readData(key + '.' + nestedKey, data[nestedKey]);
		}
	}
	
	// write to states
	else
	{
		// convert data
		node.key = key;
		data = convertNode(node, data);
		
		// get device from cache
		let val = getDeviceState(key.split('.'));
		let action = key.substr(key.lastIndexOf('.')+1);
		
		if (val === false)
		{
			// index device
			setDeviceState(key.split('.'), data);
			
			// set state
			library.set(
				{
					node: key,
					type: node.type,
					role: node.role,
					description: (node.device !== false && device ? device + ' - ' : '') + (node.description || '(no description)'),
					common: Object.assign(
						node.common || {},
						{
							write: node.subscribe || false
						}
					)
				},
				data
			);
			
			// subscribe to states
			if (SUBSCRIPTIONS.indexOf(action) > -1 && (key.indexOf('state.' + action) > -1 || key.indexOf('action.' + action) > -1))
			{
				node.subscribe = true;
				adapter.subscribeStates(key);
			}
		}
		
		// set state (if value differs)
		else if (val != data)
		{
			adapter.log.debug('Received updated value for ' + key + ': '+JSON.stringify(data));
			adapter.setState(key, {val: data, ts: Date.now(), ack: true});
		}
	}
}

/**
 *
 */
function convertNode(node, data)
{
	switch(node.convert)
	{
		case "string":
			data = JSON.stringify(data);
			break;
			
		case "temperature":
			data = data / 100;
			break;
			
		/*
		case "date-timestamp":
			
			// convert timestamp to date
			let date;
			if (data.toString().indexOf('-') > -1)
			{
				date = data
				data = Math.floor(new Date(data).getTime()/1000)
			}
			
			// or keep date if that is given
			else
			{
				let ts = new Date(data*1000);
				date = ts.getFullYear() + '-' + ('0'+ts.getMonth()).substr(-2) + '-' + ('0'+ts.getDate()).substr(-2);
			}
			
			// set date
			library.set(
				{
					node: node.key + 'Date',
					type: 'string',
					role: 'text',
					description: node.description.replace('Timestamp', 'Date')
				},
				date
			);
			break;
		
		case "ms-min":
			let duration = data/1000/60;
			return duration < 1 ? data : Math.floor(duration);
			break;
		*/
	}
	
	return data;
}

/**
 *
 */
function get(node)
{
	if (node[1] == 'timestamp' || node[1] == 'datetime') node[0] = node[1];
	node.splice(1,1);
	
	return _NODES[library.clean(node.join('.'), true)] || { description: '', role: 'text', type: 'string', convert: null };
}

/**
 *
 */
function getDeviceState(params)
{
	let type = params.splice(0,1);
	let name = params.splice(0,1);
	
	return DEVICES[type] && DEVICES[type][name] && DEVICES[type][name][params.join('.')] ? DEVICES[type][name][params.join('.')] : false;
}

/**
 *
 */
function setDeviceState(params, value)
{
	let type = params.splice(0,1);
	let name = params.splice(0,1);
	
	if (!DEVICES[type]) DEVICES[type] = {};
	if (!DEVICES[type][name]) DEVICES[type][name] = {};
	DEVICES[type][name][params.join('.')] = value;
}

/**
 *
 */
function sendCommand(device, actions)
{
	let options = {
		uri: bridge + device.trigger,
		method: 'PUT',
		json: true,
		body: actions
	};
	
	adapter.log.debug('Send command to ' + device.name + ' (' + device.trigger + '): ' + JSON.stringify(actions) + '.');
	_request(options).then(function(res)
	{
		if (!Array.isArray(res))
		{
			adapter.log.warn('Unknown error applying actions ' + JSON.stringify(actions) + ' on device ' + device.name + ' (to ' + device.trigger + ')!');
			adapter.log.debug('Response: ' + JSON.stringify(res));
		}
		
		else
		{
			let type;
			res.forEach(msg =>
			{
				type = Object.keys(msg);
				if (type == 'error')
					adapter.log.warn('Error setting ' + msg[type].address + ': ' + msg[type].description);
				else
					adapter.log.info('Successfully set ' + Object.keys(msg[type]) + ' on device ' + device.name + ' (to ' + Object.values(msg[type]) + ').');
			});
		}
		
	}).catch(function(e)
	{
		adapter.log.warn('Failed sending request to ' + device.trigger + '!');
		adapter.log.debug('Error Message: ' + e);
	});
}
