'use strict';
const adapterName = require('./io-package.json').common.name;
const utils = require('@iobroker/adapter-core'); // Get common adapter utils

const _request = require('request-promise');
const _color = require('color-convert');
const _hueColor = require('./lib/hueColor.js');


/*
 * internal libraries
 */
const Library = require(__dirname + '/lib/library.js');
const _NODES = require(__dirname + '/_NODES.js');
const _SUBSCRIPTIONS = require(__dirname + '/_SUBSCRIPTIONS.js');


/*
 * variables initiation
 */
let adapter;
let library;
let unloaded, retry = 0;
let dutyCycle, refreshCycle;

let bridge, device;
let GLOBALS = {};
let DEVICES = {};
let QUEUE = {};


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
	library = new Library(adapter, { updatesInLog: true });
	unloaded = false;
	
	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', function()
	{
		library._setValue('info.connection', true);
		if (!adapter.config.bridgeIp || !adapter.config.bridgeUser)
			return library.terminate('Please provide connection settings for Hue Bridge!');
		
		// Bridge connection
		bridge = 'http://' + adapter.config.bridgeIp + ':' + (adapter.config.bridgePort || 80) + '/api/' + adapter.config.bridgeUser + '/';
		
		// retrieve all values from states to avoid message "Unsubscribe from all states, except system's, because over 3 seconds the number of events is over 200 (in last second 0)"
		adapter.getStates(adapterName + '.' + adapter.instance + '.*', (err, states) =>
		{
			if (err || !states) return;
			
			for (let state in states)
				library.setDeviceState(state.replace(adapterName + '.' + adapter.instance + '.', ''), states[state] && states[state].val);
		
			// retrieve payload from Hue Bridge
			getPayload(adapter.config.refresh || 30);
		});
		
		// delete old states (which were not updated recently)
		clearTimeout(dutyCycle);
		dutyCycle = setTimeout(function dutyCycleRun()
		{
			if (!unloaded)
			{
				adapter.log.debug('Running Duty Cycle...');
				library.runDutyCycle(adapterName + '.' + adapter.instance, Math.floor(Date.now()/1000));
				adapter.log.debug('Duty Cycle finished.');
				dutyCycle = setTimeout(dutyCycleRun, 4*60*60*1000);
			}
			
		}, 60*1000);
		
		// start listening for events in the queue
		queue();
	});

	/*
	 * STATE CHANGE
	 *
	 */
	adapter.on('stateChange', function(id, state)
	{
		if (state === undefined || state === null || state.ack === true || state.val === undefined || state.val === null) return;
		adapter.log.debug('State of ' + id + ' has changed ' + JSON.stringify(state) + '.');
		
		// get params & action
		let params = id.replace(adapterName + '.' + adapter.instance + '.', '').split('.');
		let action = params[params.length-1];
		
		// appliance data
		let appliance = {};
		appliance.type = params.splice(0,1).toString();
		appliance.deviceId = appliance.type == 'scenes' ? params.splice(0,2).join('.') : params.splice(0,1).toString();
		appliance.name = library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.name');
		appliance.uid = library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.uid');
		appliance.trigger = appliance.type + '/' + appliance.uid + '/' + (appliance.type == 'groups' ? 'action' : 'state');
		
		// no uid
		if (!appliance.uid)
		{
			adapter.log.warn('Command can not be send to device due to error (no UID)!');
			return false;
		}
		
		// reset if scene was set
		if (id.indexOf('.scene') > -1)
			library._setValue(id, '');
		
		// build command
		let commands = { [action]: state.val };
		
		// override with provided commands
		if (action == '_commands')
		{
			try
			{
				library._setValue(id, '');
				commands = JSON.parse(state.val);
			}
			catch(err)
			{
				adapter.log.warn('Commands supplied in wrong format! Format shall be {"command": value}, e.g. {"on": true} (with parenthesis).');
				adapter.log.debug(err.message);
				return false;
			}
		}
		
		// handle sccene
		if (appliance.type == 'scenes')
		{
			let scene = {
				type: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.type'),
				groupId: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.group'),
				lights: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.lights')
			};
			
			// GroupScene
			if (scene.type == 'GroupScene')
			{
				appliance.trigger = 'groups/' + scene.groupId + '/action';
				appliance.name = DEVICES['groups'][scene.groupId].name;
				commands = { 'scene': appliance.uid };
			}
			
			// LightScene
			else if (scene.type == 'LightScene')
			{
				// trigger LightScene on each device independently
				/*
				scene.lights.split(',').forEach(light =>
				{
					adapter.setState('lights.' + light + '-' + DEVICES['lights'][light].name.toLowerCase().replace(/ /g, '_') + '.action.scene', appliance.uid, false);
				});
				
				return true;
				*/
				
				adapter.log.warn('LightScene currently not supported!');
				return false;
			}
			
			// Error
			else
			{
				adapter.log.warn('Invalid scene type given! Must bei either GroupScene or LightScene.');
				return false;
			}
		}
		
		// go through commands, modify if required and add to queue
		let value;
		for (action in commands)
		{
			value = commands[action];
			
			// handle color spaces
			let rgb = null, hsv = null;
			if (action == '_rgb')
			{
				rgb = value.split(',');
				hsv = _color.rgb.hsv(rgb);
			}
			
			else if (action == '_hsv')
				hsv = value.split(',');
			
			else if (action == '_cmyk')
				hsv = _color.cmyk.hsv(value.split(','));
			
			else if (action == '_xyz')
				hsv = _color.xyz.hsv(value.split(','));
			
			else if (action == '_hex')
				hsv = _color.hex.hsv(value.split(','));
			
			if (hsv !== null)
			{
				delete commands[action];
				Object.assign(commands, { hue: Math.ceil(hsv[0]/360*65535), sat: Math.ceil(hsv[1]/100*254), bri: Math.ceil(hsv[2]/100*254) });
			}
			
			// if device is turned on, make sure brightness is not 0
			if (action == 'on' && value == true)
			{
				let bri = library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.action.bri');
				commands.bri = bri == 0 ? 254 : bri;
			}
			
			// if device is turned off, set level / bri to 0
			/*
			if (action == 'on' && value == false)
				commands.bri = 0;
			*/
			
			// if .hue_degrees is changed, change hue
			if (action == 'hue_degrees')
			{
				delete commands[action];
				commands.hue = Math.round(value / 360 * 65535);
			}
			
			// if .level is changed the change will be applied to .bri instead
			if (action == 'level')
			{
				delete commands[action];
				Object.assign(commands, { on: true, bri: Math.ceil(254 * value / 100) });
			}
		
			// if .bri is changed, make sure light is on
			if (action == 'bri')
				Object.assign(commands, { on: true, bri: value });
			
			// if .bri is changed to 0, turn off
			if ((action == 'bri' || action == 'level') && value < 1)
			{
				delete commands['level'];
				Object.assign(commands, { on: false, bri: 0 });
			}
			
			// convert HUE to XY
			if (commands.hue !== undefined && adapter.config.hueToXY && library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.manufacturername') != 'Philips')
			{
				if (!rgb) rgb = hsv ? _color.hsv.rgb(hsv) : _color.hsv.rgb([commands.hue, (commands.sat || library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.action.sat')), commands.bri || library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.action.bri')]);
				
				if (rgb === null || rgb[0] === undefined || rgb[0] === null)
					adapter.log.warn('Invalid RGB given (' + JSON.stringify(rgb) + ')!');
				
				else
					Object.assign(commands, { "xy": JSON.stringify(_hueColor.convertRGBtoXY(rgb)) });
			}
			
			// if .on is not off, be sure device is on
			if (commands.on === undefined)
				commands.on = true; // A light cannot have its hue, saturation, brightness, effect, ct or xy modified when it is turned off. Doing so will return 201 error.
		}
		
		// check reachability
		if (appliance.type == 'lights' && !library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.state.reachable'))
			adapter.log.warn('Device ' + appliance.name + ' does not seem to be reachable! Command is sent anyway.');
		
		// queue command
		if (id.indexOf('groups.0-all_lights.') > -1)
		{
			Object.keys(DEVICES['groups']).forEach(groupId =>
			{
				let group = DEVICES['groups'][groupId];
				
				appliance.deviceId = groupId + '-' + group.name.toLowerCase().replace(/ /g, '_');
				appliance.name = library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.name');
				appliance.uid = groupId;
				appliance.trigger = 'groups/' + groupId + '/action';
				
				addToQueue(appliance, commands);
			});
		}
		else
			addToQueue(appliance, commands);
	});
	
	/*
	 * HANDLE MESSAGES
	 *
	 */
	adapter.on('message', function(msg)
	{
		adapter.log.debug('Message: ' + JSON.stringify(msg));
		
		switch(msg.command)
		{
			case 'getUser':
				getUser(username =>
				{
					adapter.log.debug('Retrieved user from Hue Bridge: ' + JSON.stringify(username));
					library.msg(msg.from, msg.command, {result: true, user: username}, msg.callback);
					
				}, error =>
				{
					adapter.log.warn('Failed retrieving user (' + error + ')!');
					library.msg(msg.from, msg.command, {result: false, error: error}, msg.callback);
				});
				
				break;
		}
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
			library.resetStates();
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
 *
 */
function getPayload(refresh)
{
	_request({ uri: bridge, json: true }).then(payload =>
	{
		if (!payload || (payload[0] && payload[0].error))
		{
			adapter.log.error('Error retrieving data from Hue Bridge' + (payload[0] && payload[0].error ? ': ' + payload[0].error.description : '!'));
			return false;
		}
		
		retry = 0;
		
		// add meta data
		library.set({ ..._NODES.datetime, 'node': 'datetime' }, library.getDateTime(Date.now()));
		library.set({ ..._NODES.timestamp, 'node': 'timestamp' }, Math.floor(Date.now()/1000));
		library.set({ ..._NODES.syncing, 'node': 'syncing' }, true);
		
		// go through channels
		for (let channel in payload)
		{
			// create channel
			library.set({
				node: channel,
				role: 'channel',
				description: library.ucFirst(channel.substr(channel.lastIndexOf('.')+1))
			});
			
			if (adapter.config['sync' + library.ucFirst(channel)])
				addBridgeData(channel, payload[channel]);
			
			else
				library.set({ ..._NODES.syncing, 'node': channel + '.syncing' }, false);
		}
		
		// refresh interval
		if (refresh > 0 && refresh < 3)
		{
			adapter.log.warn('Due to performance reasons, the refresh rate can not be set to less than 3 seconds. Using 3 seconds now.');
			refresh = 3;
		}
		
		if (refresh > 0 && !unloaded)
			refreshCycle = setTimeout(getPayload, refresh*1000, refresh);
		
	}).catch(err =>
	{
		// Indicate that tree is not synchronized anymore
		library.set({ ..._NODES.syncing, 'node': 'syncing' }, false);
		
		// ERROR
		let error = err.message;
		
		// ERROR: HTTP 500
		if (err.message.substr(0, 3) == 500)
			error = 'Hue Bridge is busy';
		
		// ERROR: ECONNREFUSED
		else if (err.message.indexOf('ECONNREFUSED') > -1)
			error = 'Connection refused';
		
		// ERROR: SOCKET HANG UP
		else if (err.message.indexOf('socket hang up') > -1)
			error = 'Socket hang up';
		
		// TRY AGAIN OR STOP ADAPTER
		if (retry < 10)
		{
			adapter.log.warn('Error connecting to Hue Brdige: ' + error + '. Retried ' + retry + 'x so far. Try again in 10 seconds..');
			retry++;
			setTimeout(getPayload, 10*1000, refresh);
		}
		else
		{
			library.terminate('Error connecting to Hue Brdige: ' + error + '. Retried ' + retry + 'x already, thus connection closed now. See debug log for details.');
			adapter.log.debug(err.message);
			adapter.log.debug(JSON.stringify(err.stack));
		}
	});
}


/**
 *
 */
function addBridgeData(channel, data)
{
	// index
	DEVICES[channel] = JSON.parse(JSON.stringify(data));
	
	// reset global states
	if (channel == 'lights')
	{
		GLOBALS.allOn = false;
		GLOBALS.anyOn = false;
	}
	
	// add "all" group
	else if (channel == 'groups')
	{
		data[0] = {
			"name": "All Lights",
			"type": "LightGroup",
			"action":{
				"on": false,
				"bri": 0,
				"hue": 0,
				"sat": 0,
				"effect": "none",
				"xy":[
					0,
					0
				],
				"ct": 0,
				"alert": "lselect",
				"colormode": "xy"
			}
		};
		
		if (DEVICES['lights'] !== undefined)
		{
			data[0].lights = Object.keys(DEVICES['lights']);
			data[0].state = {
				"all_on": GLOBALS.allOn || false,
				"any_on": GLOBALS.anyOn || false
			};
		}
	}
	
	// add meta data
	library.set({ ..._NODES.datetime, 'node': channel + '.datetime' }, library.getDateTime(Date.now()));
	library.set({ ..._NODES.timestamp, 'node': channel + '.timestamp' }, Math.floor(Date.now()/1000));
	library.set({ ..._NODES.syncing, 'node': channel + '.syncing' }, true);
	
	// loop through payload
	device = null;
	readData(channel, data, channel);
}

/**
 *
 */
function readData(key, data, channel)
{
	// only proceed if data is given
	if (data === undefined || data === 'undefined')
		return false;
	
	// index scenes
	if (channel == 'scenes' && data['name'])
	{
		if (!GLOBALS['scenes']) GLOBALS['scenes'] = [];
		//GLOBALS['scenes'].push(data['name']);
		//library.set();
	}
	
	// set current device name
	if (data && data.name)
		device = data.name;
	
	// get node details
	key = key.replace(/ /g, '_');
	let node = get(key.split('.')); // lights.<NAME/ID>.folder
	
	// loop nested data
	if (data !== null && typeof data == 'object' && !(Array.isArray(data) && (key.substr(-2) == 'xy' || key.substr(-6) == 'lights')))
	{
		// create channel
		if (Object.keys(data).length > 0)
		{
			// use uid and name instead of only uid
			let id = false;
			if (data.name && key.indexOf('config') == -1)
			{
				data.uid = key.substr(key.lastIndexOf('.')+1);
				id = data.name.toLowerCase().replace(/ /g, '_');
				key = key.indexOf('scenes') == -1 ?
					key.replace('.' + data.uid, '.' + data.uid + '-' + id) :
					key.replace('.' + data.uid, '.' + id);
			}
			
			// add additional states
			if (data.bri !== undefined)
				data.level = data.bri > 0 ? Math.ceil(data.bri / 254 * 100) : 0;
			
			if (data.bri !== undefined && data.sat !== undefined && data.hue !== undefined)
			{
				data.hue_degrees = Math.round(data.hue / 65535 * 360);
				data.transitiontime = data.transitiontime || 4;
				data.scene = '';
				data._commands = '';
				
				data._hsv = data.hue_degrees + ','+ (data.sat > 0 ? Math.ceil(data.sat/254*100) : 0) + ',' + data.level;
				data._rgb = _color.hsv.rgb(data._hsv.split(',')).toString();
				data._cmyk = _color.rgb.cmyk(data._rgb.split(',')).toString();
				data._xyz = _color.rgb.xyz(data._rgb.split(',')).toString();
				data._hex = _color.rgb.hex(data._rgb.split(','));
			}
			
			// get allOn / anyOn state
			if (channel == 'lights' && data.on)
			{
				GLOBALS.allOn = GLOBALS.allOn && data.on;
				GLOBALS.anyOn = GLOBALS.anyOn || data.on;
			}
			
			// add scene trigger button as additional state (only to scenes)
			if (data.type == 'GroupScene' || data.type == 'LightScene')
				data.action = { trigger: false };
			
			// create channel
			library.set({
				node: key,
				role: 'channel',
				description: id || RegExp('\.[0-9]{1-3}$').test(key.substr(-4)) ? data.name : library.ucFirst(key.substr(key.lastIndexOf('.')+1))
			});
			
			// read nested data
			for (let nestedKey in data)
			{
				let pathKey = '';
				
				// create sub channel for scenes
				if (key.indexOf('scenes') > -1 && ((data.type == 'GroupScene' && data.group) || (data.type == 'LightScene' && data.lights && data.lights[0])))
				{
					pathKey = '.' + data.type + '-' + (data.group || data.lights[0]) + '_' + data.uid;
					library.set({
						node: key + pathKey,
						role: 'channel',
						description: data.type + ' ' + (data.group || data.lights[0])
					});
				}
				
				readData(key + pathKey + '.' + nestedKey, data[nestedKey], channel);
			}
		}
	}
	
	// write to states
	else
	{
		// convert data
		node.key = key;
		data = convertNode(node, data);
		
		// remap state to action
		let action = key.substr(key.lastIndexOf('.')+1);
		if (_SUBSCRIPTIONS.indexOf(action) > -1 && key.indexOf('state.' + action) > -1)
		{
			key = key.replace('.state.', '.action.');
			library.set({
				node: key.substr(0, key.indexOf('.action.')+7),
				role: 'channel',
				description: 'Action'
			});
		}
		
		// set state
		library.set(
			{
				node: key,
				type: node.type,
				role: node.role,
				description: (node.device !== false && device ? device + ' - ' : '') + (node.description || library.ucFirst(key.substr(key.lastIndexOf('.')+1))),
				common: Object.assign(
					node.common || {},
					{
						write: (_SUBSCRIPTIONS.indexOf(action) > -1 && key.indexOf('action.' + action) > -1)
					}
				)
			},
			data
		);
		
		// subscribe to states
		if (_SUBSCRIPTIONS.indexOf(action) > -1 && key.indexOf('action.' + action) > -1)
		{
			node.subscribe = true;
			adapter.subscribeStates(key);
		}
	}
}

/**
 *
 */
function convertNode(node, data)
{
	if (Array.isArray(data))
		data = data.join(',');
	
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
	node.splice(1,1);
	return _NODES[library.clean(node[node.length-1], true)] || _NODES[library.clean(node.join('.'), true)] || { description: '', role: 'text', type: 'string', convert: null };
}

/**
 *
 */
function sendCommand(device, actions)
{
	// align command xy
	if (actions.xy)
	{
		try
		{
			Object.assign(actions, { "xy": JSON.parse(actions.xy) });
		}
		catch(err)
		{
			adapter.log.warn('Error converting xy!');
			return false;
		}
	}
	
	// set options
	let options = {
		uri: bridge + device.trigger,
		method: 'PUT',
		json: true,
		body: actions
	};
	
	// send command
	adapter.log.debug('Send command to ' + device.name + ' (' + device.trigger + '): ' + JSON.stringify(actions) + '.');
	_request(options).then(res =>
	{
		if (!Array.isArray(res))
		{
			adapter.log.warn('Unknown error applying actions ' + JSON.stringify(actions) + ' on ' + device.name + ' (to ' + device.trigger + ')!');
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
					adapter.log.info('Successfully set ' + Object.keys(msg[type]) + ' on ' + device.name + ' (to ' + Object.values(msg[type]) + ').');
			});
		}
		
	}).catch(err =>
	{
		adapter.log.warn('Failed sending request to ' + device.trigger + '!');
		adapter.log.debug('Error Message: ' + err.message);
	});
}

/**
 *
 */
function addToQueue(appliance, commands)
{
	adapter.log.debug('Add to queue (' + JSON.stringify(appliance) + ') commands: ' + JSON.stringify(commands));
	QUEUE[appliance.trigger] = QUEUE[appliance.trigger] ? { ...appliance, commands: Object.assign({}, QUEUE[appliance.trigger].commands, commands) } : { ...appliance, commands: commands };
}

/**
 *
 */
function queue()
{
	for (let trigger in QUEUE)
	{
		let service = QUEUE[trigger];
		
		Object.keys(service.commands).forEach(command => library.setDeviceState(service.type + '.' + service.deviceId + '.' + command, '')); // reset stored states so that retrieved states will renew
		sendCommand({ trigger: trigger, name: service.name }, service.commands);
		delete QUEUE[trigger];
	}
	
	let queueRun = setTimeout(queue, (adapter.config.queue || 3)*1000);
}

/**
 *
 */
function getUser(success, failure)
{
	let options = {
		uri: 'http://' + adapter.config.bridgeIp + ':' + (adapter.config.bridgePort || 80) + '/api/',
		method: 'POST',
		json: true,
		body: { "devicetype": "iobroker.hue-extended#iphone peter" }
	};
	
	_request(options).then(res =>
	{
		if (res && res[0] && res[0].success && res[0].success.username)
			success && success(res[0].success.username);
		
		else if (res && res[0] && res[0].error && res[0].error.description)
			failure && failure(res[0].error.description);
		
		else
			failure && failure('Unknown error occurred!');
		
	}).catch(err =>
	{
		failure && failure(err.message);
	});
}