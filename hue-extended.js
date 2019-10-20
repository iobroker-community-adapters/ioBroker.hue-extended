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
const _NODES = require(__dirname + '/_NODES.js').STATES;
const _MAPPING = require(__dirname + '/_NODES.js').MAPPING;
const _SUBSCRIPTIONS = require(__dirname + '/_NODES.js').SUBSCRIPTIONS;


/*
 * variables initiation
 */
let adapter;
let library;
let unloaded, delay = 0, retry = {};
let garbageCollector, refreshCycle;

let bridge, device;
let DEVICES = {};
let QUEUE = {};


/*
 * ADAPTER
 *
 */
function startAdapter(options)
{
	options = options || {};
	adapter = new utils.Adapter({ ...options, name: adapterName });
	
	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', function()
	{
		unloaded = false;
		library = new Library(adapter, { nodes: _NODES, updatesInLog: adapter.config.debug || false });
		
		// Check Node.js Version
		let version = parseInt(process.version.substr(1, process.version.indexOf('.')-1));
		if (version <= 6)
			return library.terminate('This Adapter is not compatible with your Node.js Version ' + process.version + ' (must be >= Node.js v7).', true);
		
		// Check Configuration
		library.set(Library.CONNECTION, true);
		if (!adapter.config.bridgeIp || !adapter.config.bridgeUser)
			return library.terminate('Please provide connection settings for Hue Bridge!');
		
		// Bridge connection
		bridge = 'http://' + adapter.config.bridgeIp + ':' + (adapter.config.bridgePort || 80) + '/api/' + adapter.config.bridgeUser + '/';
		
		// retrieve all values from states to avoid message "Unsubscribe from all states, except system's, because over 3 seconds the number of events is over 200 (in last second 0)"
		adapter.getStates(adapterName + '.' + adapter.instance + '.*', (err, states) =>
		{
			library.set(Library.CONNECTION, true);
			
			// set current states from objects
			for (let state in states)
				library.setDeviceState(state.replace(adapterName + '.' + adapter.instance + '.', ''), states[state] && states[state].val);
			
			// retrieve payload from Hue Bridge
			getPayload(adapter.config.refresh || 30);
			
			// add states for last action
			readData(
				'info',
				{
					'lastAction': {
						'timestamp': library.getDeviceState('info.lastAction.timestamp'),
						'datetime': library.getDeviceState('info.lastAction.datetime'),
						'lastCommand': library.getDeviceState('info.lastAction.lastCommand'),
						'lastResult': library.getDeviceState('info.lastAction.lastResult'),
						'error': library.getDeviceState('info.lastAction.error')
					}
				},
				''
			);
		});
		
		// delete old states (which were not updated recently)
		clearTimeout(garbageCollector);
		garbageCollector = setTimeout(function runGarbageCollector()
		{
			if (!unloaded && adapter.config.garbageCollector)
			{
				adapter.log.debug('Running Garbage Collector...');
				library.runGarbageCollector('device', true, Date.now(), true, 24*60*60);
				adapter.log.debug('Garbage Collector finished.');
				garbageCollector = setTimeout(runGarbageCollector, 4*60*60*1000); // run every 4h
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
		let path = params.join('.');
		
		// appliance data
		let appliance = {};
		appliance.path = path.substr(0, path.lastIndexOf('.'));
		appliance.type = params.splice(0,1).toString();
		appliance.deviceId = appliance.type == 'scenes' ? params.splice(0,2).join('.') : params.splice(0,1).toString();
		appliance.name = library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.name');
		appliance.uid = library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.uid');
		appliance.trigger = appliance.type + '/' + appliance.uid + '/' + (appliance.type == 'groups' ? 'action' : (appliance.type == 'sensors' ? 'config' : 'state'));
		
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
				name: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.name'),
				type: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.type'),
				groupId: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.group'),
				lights: library.getDeviceState(appliance.type + '.' + appliance.deviceId + '.lights')
			};
			
			// GroupScene
			if (scene.type == 'GroupScene')
			{
				appliance.trigger = 'groups/' + scene.groupId + '/action';
				appliance.name = DEVICES['groups'][scene.groupId].name + ' (' + scene.name + ')';
				commands = { 'scene': appliance.uid };
			}
			
			// LightScene
			else if (scene.type == 'LightScene')
			{
				appliance.trigger = 'groups/0/action';
				appliance.name = 'lights (' + scene.name + ')';
				commands = { 'scene': appliance.uid };
			}
			
			// Error
			else
			{
				adapter.log.warn('Invalid scene type given! Must bei either GroupScene or LightScene.');
				return false;
			}
		}
		
		// handle schedules
		else if (appliance.type == 'schedules' || appliance.type == 'rules')
		{
			let options = null;
			try
			{
				options = JSON.parse(library.getDeviceState(appliance.path + '.options'));
				
				appliance.method = options.method;
				appliance.trigger = options.address;
				commands = options.body;
			}
			catch(err)
			{
				adapter.log.warn('Invalid schedules data given!');
				adapter.log.debug(err.message);
				return false;
			}
		}
		
		// handle lights or groups
		else if (appliance.type == 'lights' || appliance.type == 'groups')
		{
			// handle color spaces
			let value = commands[action];
			let rgb = null, hsv = null;
			if (action == 'rgb')
			{
				rgb = value.split(',');
				hsv = _color.rgb.hsv(rgb);
			}
			
			else if (action == 'hsv')
				hsv = value.split(',');
			
			else if (action == 'cmyk')
				hsv = _color.cmyk.hsv(value.split(','));
			
			else if (action == 'xyz')
				hsv = _color.xyz.hsv(value.split(','));
			
			else if (action == 'hex')
				hsv = _color.hex.hsv(value.split(','));
			
			if (hsv !== null)
			{
				delete commands[action];
				commands = {
					'hue': hsv[0],
					'sat': Math.max(Math.min(Math.round(hsv[1]*2.54), 254), 0),
					'bri': Math.max(Math.min(Math.round(hsv[2]*2.54), 254), 0),
					...commands
				};
			}
			
			// go through commands, modify if required and add to queue
			for (action in commands)
			{
				value = commands[action];
				
				// remap states back due to standardization
				let remapped = Object.values(_MAPPING).indexOf(action);
				if (remapped > -1)
				{
					let key = Object.keys(_MAPPING)[remapped];
					commands[key] = commands[action];
					delete commands[action];
					action = key;
				}
				
				// if device is turned off, set brightness to 0
				// NOTE: Brightness is a scale from 1 (the minimum the light is capable of) to 254 (the maximum).
				if (action == 'on' && value == false && library.getDeviceState(appliance.path + '.brightness') !== null && commands.level === undefined && commands.bri === undefined && adapter.config.briWhenOff)
				{
					library.setDeviceState(appliance.path + '.real_brightness', library.getDeviceState(appliance.path + '.brightness') || 0);
					library._setValue(appliance.path + '.brightness', 0);
					library._setValue(appliance.path + '.level', 0);
				}
				
				// if device is turned on, make sure brightness is not 0
				if (action == 'on' && value == true && library.getDeviceState(appliance.path + '.brightness') !== null && commands.level === undefined && commands.bri === undefined)
				{
					let bri = library.getDeviceState(appliance.path + '.real_brightness') || 0;
					commands.bri = bri == 0 ? 254 : bri;
				}
				
				// if .level is changed the change will be applied to .brightness instead
				if (action == 'level' && value > 0)
				{
					delete commands[action];
					Object.assign(commands, { on: true, bri: Math.max(Math.min(Math.round(value*2.54), 254), 0) });
				}
			
				// if .bri is changed, make sure light is on
				if (action == 'bri' && value > 0)
					Object.assign(commands, { on: true, bri: value });
				
				// if .bri is changed to 0, turn off
				if ((action == 'bri' || action == 'level') && value <= 0)
				{
					delete commands['level'];
					Object.assign(commands, { on: false }); // , bri: 0
				}
				
				// convert value ranges
				if (action == 'hue' && value <= 360)
					commands.hue = Math.max(Math.min(Math.round(value / 360 * 65535), 65535), 0);
				
				if (action == 'ct')
					commands.ct = Math.max(Math.min(Math.round(1 / value * 1000000), 500), 153);
				
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
		}
		
		// queue command
		if (adapter.config.useQueue)
			addToQueue(appliance, commands);
		else
			sendCommand(appliance, commands)
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
			clearTimeout(garbageCollector);
			
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
	// get data from bridge
	_request({ uri: bridge, json: true }).then(payload =>
	{
		if (!payload || (payload[0] && payload[0].error))
		{
			adapter.log.error('Error retrieving payload from Hue Bridge' + (payload[0] && payload[0].error ? ': ' + payload[0].error.description : '!'));
			return false;
		}
		
		// add meta data
		library.set({ ...library.getNode('datetime'), 'node': 'info.datetime' }, library.getDateTime(Date.now()));
		library.set({ ...library.getNode('timestamp'), 'node': 'info.timestamp' }, Math.floor(Date.now()/1000));
		library.set({ ...library.getNode('syncing'), 'node': 'info.syncing' }, true);
		
		// go through channels
		for (let channel in payload)
		{
			// create channel
			library.set({
				'node': channel,
				'role': 'channel',
				'description': library.ucFirst(channel.substr(channel.lastIndexOf('.')+1))
			});
			
			// sync all groups
			if (channel == 'groups')
			{
				_request({ uri: bridge + channel + '/0', json: true }).then(pl =>
				{
					pl.name = 'All Lights';
					
					// index
					DEVICES[channel] = JSON.parse(JSON.stringify(payload));
					DEVICES[channel][0] = JSON.parse(JSON.stringify(pl));
					
					// only write if syncing is on
					if (adapter.config['sync' + library.ucFirst(channel)])
						addBridgeData(channel, { '0': pl });
				});
			}
			else
				DEVICES[channel] = JSON.parse(JSON.stringify(payload)); // copy and index payload
			
			// only write if syncing is on
			if (adapter.config['sync' + library.ucFirst(channel)])
			{
				// update overall syncing information
				library.set({ ...library.getNode('datetime'), 'node': 'info.datetime' }, library.getDateTime(Date.now()));
				library.set({ ...library.getNode('timestamp'), 'node': 'info.timestamp' }, Math.floor(Date.now()/1000));
				library.set({ ...library.getNode('syncing'), 'node': 'info.syncing' }, true);
				library.set({ ...library.getNode('syncing'), 'node': 'info.syncing' + library.ucFirst(channel) }, true);
				library.set({ ...library.getNode('syncing'), 'node': channel + '.syncing' }, true);
				
				// add to states
				addBridgeData(channel, payload[channel]);
			}
			
			else
			{
				library.set({ ...library.getNode('syncing'), 'node': channel + '.syncing' }, false);
				library.set({ ...library.getNode('syncing'), 'node': 'info.syncing' + library.ucFirst(channel) }, false);
			}
		}
		
		
		// refresh interval
		retry = 0;
		
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
		library.set({ ...library.getNode('syncing'), 'node': 'info.syncing' }, false);
		//library.set({ ...library.getNode('syncing'), 'node': 'info.syncing' + library.ucFirst(channel) }, false);
		//library.set({ ...library.getNode('syncing'), 'node': channel + '.syncing' }, false);
		
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
		if (!retry || retry < 10)
		{
			adapter.log.debug('Error connecting to Hue Bridge: ' + error + '. ' + (retry > 0 ? 'Already retried ' + retry + 'x so far. ' : '') + 'Try again in 10 seconds..');
			//adapter.log.debug(err.message);
			//adapter.log.debug(JSON.stringify(err.stack));
			retry = !retry ? 1 : retry+1;
			refreshCycle = setTimeout(getPayload, 10*1000, refresh);
		}
		else
		{
			library.terminate('Error connecting to Hue Bridge: ' + error + '. ' + (retry > 0 ? 'Already retried ' + retry + 'x in total, thus connection closed now.' : 'Connection closed.') + ' See debug log for details.');
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
	// add meta data
	library.set({ ...library.getNode('datetime'), 'node': channel + '.datetime' }, library.getDateTime(Date.now()));
	library.set({ ...library.getNode('timestamp'), 'node': channel + '.timestamp' }, Math.floor(Date.now()/1000));
	library.set({ ...library.getNode('syncing'), 'node': channel + '.syncing' }, true);
	
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
	
	// skip recycled
	if (channel && !adapter.config['sync' + library.ucFirst(channel) + 'Recycled'] && data && data['recycle'] === true)
	{
		adapter.log.silly('Skipping device ' + data['name'] + ' in channel ' + channel + '.');
		return false;
	}
	
	// set current device name
	if (data && data.name)
		device = data.name;
	
	// get node details
	key = key.replace(/ /g, '_');
	let node = get(key.split('.'));
	
	// loop nested data
	if (data !== null && typeof data == 'object' && !(Array.isArray(data) && (key.substr(-2) == 'xy' || key.substr(-6) == 'lights' || key.substr(-7) == 'sensors' || key.substr(-5) == 'links')))
	{
		// create channel
		if (Object.keys(data).length > 0)
		{
			let description = false;
			
			// add last seen date
			if (data.name)
				data.lastSeen = library.getDateTime(Date.now());
			
			// use uid and name instead of only uid
			let id = false;
			if (data.name && key.indexOf('config') == -1 && key.indexOf('scenes') == -1 && key.indexOf('resourcelinks') == -1)
			{
				data.uid = key.substr(key.lastIndexOf('.')+1);
				id = library.clean(data.name, true, '_').replace(/\./g, '-');
				let uid = ('00' + data.uid).substr(-3);
				
				// append UID
				if (adapter.config.nameId == 'append')
					key = key.replace('.' + data.uid, '.' + id + '-' + data.uid);
					
				// prepend UID
				else
					key = key.replace('.' + data.uid, '.' + uid + '-' + id);
			}
			
			// change state for resourcelinks
			if (data.name && channel == 'resourcelinks')
			{
				data.uid = key.substr(key.lastIndexOf('.')+1);
				id = library.clean(data.name, true, '_').replace(/\./g, '-');
				key = key.replace('.' + data.uid, '.' + id);
			}
			
			// change state for rules
			if (channel == 'rules' && key.substr(-7) == 'actions')
			{
				key = key.replace('.actions', '.action');
				let states = {};
				let action;
				
				data.forEach(trigger =>
				{
					action = Object.keys(trigger.body).join('-');
					states[library.clean(action, true, '-')] = { 'trigger': false, 'options': JSON.stringify(trigger) };
				});
				
				data = states;
			}
			
			// change state for schedules
			if (channel == 'schedules' && key.substr(-7) == 'command')
			{
				key = key.replace('.command', '') + '.action';
				
				data.address = data.address.substr(data.address.indexOf('/', 5)+1, data.address.length);
				data = { 'trigger': false, 'options': JSON.stringify(data) };
			}
			
			// add additional states level, scene, _commands and lastAction
			if (data.bri !== undefined)
			{
				data.level = data.bri > 0 ? Math.max(Math.min(Math.round(data.bri/2.54), 100), 0) : 0;
				data.scene = '';
				data._commands = '';
				
				// add states for last action
				readData(
					key.replace('.state', '.action'),
					{
						'lastAction': {
							'timestamp': library.getDeviceState(key.replace('.state', '.action') + '.lastAction.timestamp'),
							'datetime': library.getDeviceState(key.replace('.state', '.action') + '.lastAction.datetime'),
							'lastCommand': library.getDeviceState(key.replace('.state', '.action') + '.lastAction.lastCommand'),
							'lastResult': library.getDeviceState(key.replace('.state', '.action') + '.lastAction.lastResult'),
							'error': library.getDeviceState(key.replace('.state', '.action') + '.lastAction.error')
						}
					},
					channel
				);
			}
			
			// convert value ranges
			if (data.hue !== undefined)
				data.hue = Math.max(Math.min(Math.round(data.hue / 65535 * 360), 360), 0);
			
			if (data.ct !== undefined && typeof data.ct !== 'object')
				data.ct = Math.max(Math.min(Math.round(1 / data.ct * 1000000), 6500), 2000);
			
			// add additional color spaces
			if (data.bri !== undefined && data.sat !== undefined && data.hue !== undefined)
			{
				data.transitiontime = data.transitiontime || 4;
				data.hsv = data.hue + ','+ (data.sat > 0 ? Math.max(Math.min(Math.round(data.sat/2.54), 100), 0) : 0) + ',' + data.level;
				data.rgb = _color.hsv.rgb(data.hsv.split(',')).toString();
				//data.cmyk = _color.rgb.cmyk(data.rgb.split(',')).toString();
				//data.xyz = _color.rgb.xyz(data.rgb.split(',')).toString();
				data.hex = _color.rgb.hex(data.rgb.split(','));
			}
			
			// set brightness to 0 when device is off
			let real_bri = library.getDeviceState(key.replace('.state', '.action') + '.real_brightness');
			if (data.bri !== undefined && data.on == false && adapter.config.briWhenOff)
			{
				data.bri = 0;
				data.level = 0;
			}
			else if (data.bri !== undefined && data.on == true && real_bri != data.bri && adapter.config.briWhenOff)
				library.setDeviceState(key.replace('.state', '.action') + '.real_brightness', data.bri);
			
			// add scene trigger button as additional state (only to scenes)
			if (data.type == 'GroupScene' || data.type == 'LightScene')
			{
				data.action = { 'trigger': false };
				data.uid = key.substr(key.lastIndexOf('.')+1);
			}
			
			// remap states for standardization (see https://github.com/Zefau/ioBroker.hue-extended/issues/1 and https://forum.iobroker.net/post/298019)
			for (let state in _MAPPING)
			{
				if (data[state] !== undefined && typeof data[state] !== 'object')
				{
					data[_MAPPING[state]] = data[state];
					delete data[state];
				}
			}
			
			// read nested data
			for (let nestedKey in data)
			{
				let pathKey = '';
				
				// create sub channel for scenes
				if (key.indexOf('scenes') > -1 && ((data.type == 'GroupScene' && data.group) || (data.type == 'LightScene' && data.lights && data.lights[0])))
				{
					// skips if groups are not indexed so far
					if (data.type == 'GroupScene' && (!DEVICES['groups'] || !DEVICES['groups'][data.group]))
					{
						adapter.log.silly('Groups not yet given, thus scene ' + data.name + ' (' + data.uid + ') skipped for now.');
						return false;
					}
					
					// LightScene
					let pathDescription = '';
					if (data.type == 'LightScene')
					{
						key = key.replace('.' + data.uid, adapter.config.sceneNaming == 'scene' ? '.' + id : '.LightScenes');
						pathKey = '.' + library.clean(data.name, true, '_').replace(/\./g, '-') + '_' + data.lights.join('-');
						
						description = 'Light Scenes';
						pathDescription = 'Scene ' + data.name + ' for ' + (data.lights.length > 1 ? 'lights ' + data.lights.join(', ') : 'light ' + data.lights[0]);
					}
					
					// GroupScene
					else
					{
						let groupId = library.clean(DEVICES['groups'][data.group].name, true, '_').replace(/\./g, '-');
						let groupUid = DEVICES['groups'][data.group].uid;
						let group = adapter.config.nameId == 'append' ? groupId + '-' + groupUid : ('00' + groupUid).substr(-3) + '-' + groupId;
						let scene = library.clean(data.name, true, '_').replace(/\./g, '-');
						
						// scene.group
						if (adapter.config.sceneNaming == 'scene')
						{
							key = key.replace('.' + data.uid, '.' + scene);
							pathKey = '.' + group;
							description = 'Scene ' + data.name;
							pathDescription = 'Group ' + DEVICES['groups'][data.group].name;
						}
						
						// group.scene
						else
						{
							key = key.replace('.' + data.uid, '.' + group);
							pathKey = '.' + scene;
							description = 'Scenes for Group ' + DEVICES['groups'][data.group].name;
							pathDescription = 'Scene ' + data.name;
						}
					}
					
					// Duplicates
					let uid = library.getDeviceState(key + pathKey + '.uid');
					if (uid && uid != data.uid)
						pathKey += '_' + data.uid;
					
					// create channel for group and scene
					library.set({
							'node': key + pathKey,
							'role': 'channel',
							'description': pathDescription
						},
						null, { 'properties': { 'device': true } });
				}
				
				// read data
				readData(key + pathKey + '.' + nestedKey, data[nestedKey], channel);
			}
			
			// create channel
			library.set({
					'node': key,
					'role': 'channel',
					'description': description || id && data.name || library.ucFirst(key.substr(key.lastIndexOf('.')+1))
				},
				null, { 'properties': { 'device': true } });
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
		if (_SUBSCRIPTIONS.indexOf(action) > -1 && (key.indexOf('state.' + action) > -1 || key.indexOf('config.' + action) > -1))
		{
			key = key.replace('.state.', '.action.').replace('.config.', '.action.');
			library.set({
					node: key.substr(0, key.indexOf('.action.')+7),
					role: 'channel',
					description: 'Action'
				},
				null, { 'properties': { 'device': true } });
		}
		
		// set state
		library.set(
			{
				'node': key,
				'type': node.type,
				'role': node.role,
				'description': (node.device !== false && device ? device + ' - ' : '') + (node.description || library.ucFirst(key.substr(key.lastIndexOf('.')+1))),
				'common': Object.assign(
					node.common || {},
					{
						'write': (_SUBSCRIPTIONS.indexOf(action) > -1 && key.indexOf('action.' + action) > -1)
					}
				)
			},
			data,
			{
				'properties': { 'device': true }
			}
		);
		
		// subscribe to states
		if (_SUBSCRIPTIONS.indexOf(action) > -1 && key.indexOf('.action.') > -1 && key.indexOf('.' + action) > -1)
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
	// flatten Array
	if (Array.isArray(data))
		data = data.join(',');
	
	// convert
	switch(node.convert)
	{
		case "temperature":
			data = data / 100;
			break;
	}
	
	return data;
}

/**
 *
 */
function get(node)
{
	let ns = node.shift() || ''; // lights, groups, scenes, etc.
	
	return _NODES[library.clean(ns + '.' + node.join('.'))] || // from --lights.<light>.name-- it searches the whole string
			_NODES[library.clean(ns + '.' + node.slice(1).join('.'))] || // from --lights.<light>.name-- it removes <light> and searches --lights.name--
			_NODES[library.clean(ns + '.' + node.slice(2).join('.'))] || // from --scenes.<group>.<scene>.name-- it removes <group> and <scene> and searches --scenes.name--
			_NODES[library.clean(node[node.length-1])] || // from --lights.<light>.name-- it removes everything except the state and searches --name--
			{ 'description': '(no description given)', 'role': 'text', 'type': 'string', 'convert': null };
}

/**
 *
 */
function sendCommand(device, actions)
{
	// reset stored states so that retrieved states will renew
	Object.keys(actions).forEach(action => library.setDeviceState(device.type + '.' + device.deviceId + '.' + action, ''));
	
	// align command xy
	if (actions.xy && !Array.isArray(actions.xy))
		actions.xy = actions.xy.split(',').map(val => Number.parseFloat(val));
	
	// clean trigger
	device.trigger = device.trigger.substr(0, 1) == '/' ? device.trigger.substr(1, device.trigger.length) : device.trigger;
	
	// set options
	let options = {
		uri: bridge + device.trigger,
		method: device.method || 'PUT',
		json: true,
		body: actions
	};
	
	// send command
	let error = false, lastAction = null;
	adapter.log.debug('Send command to ' + device.name + ' (' + device.trigger + '): ' + JSON.stringify(actions) + '.');
	
	_request(options).then(res =>
	{
		if (!Array.isArray(res))
		{
			adapter.log.warn('Unknown error applying actions ' + JSON.stringify(actions) + ' on ' + device.name + ' (to ' + device.trigger + ')!');
			adapter.log.debug('Response: ' + JSON.stringify(res));
			
			lastAction = {'lastAction': { 'timestamp': Math.floor(Date.now()/1000), 'datetime': library.getDateTime(Date.now()), 'lastCommand': JSON.stringify(actions), 'lastResult': JSON.stringify(res), 'error': true }};
			readData(device.path, lastAction);
			readData('info', lastAction);
		}
		
		else
		{
			error = JSON.stringify(res).indexOf('error') > -1;
			lastAction = {'lastAction': { 'timestamp': Math.floor(Date.now()/1000), 'datetime': library.getDateTime(Date.now()), 'lastCommand': JSON.stringify(actions), 'lastResult': JSON.stringify(res), 'error': error }};
			readData(device.path, lastAction);
			readData('info', lastAction);
			
			let type;
			res.forEach(msg =>
			{
				type = Object.keys(msg);
				if (type == 'error')
					adapter.log.warn('Error setting ' + msg[type].address + ': ' + msg[type].description);
				else
					adapter.log.debug('Successfully set ' + Object.keys(msg[type]) + ' on ' + device.name + ' (to ' + Object.values(msg[type]) + ').');
			});
			
			if (!error)
				adapter.log.info('Successfully set ' + device.name + '.');
		}
		
	}).catch(err =>
	{
		adapter.log.warn('Failed sending request to ' + device.trigger + '!');
		adapter.log.debug('Error Message: ' + err.message);
		
		lastAction = {'lastAction': { 'timestamp': Math.floor(Date.now()/1000), 'datetime': library.getDateTime(Date.now()), 'lastCommand': JSON.stringify(actions), 'lastResult': '[{ "error": { "type": "unknown", "address": "' + device.trigger + '", "description": "' + err.message + '" } }]', 'error': true }};
		readData(device.path, lastAction);
		readData('info', lastAction);
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
		let appliance = QUEUE[trigger];
		sendCommand({ ...appliance, trigger: trigger }, appliance.commands);
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
		body: { 'devicetype': 'iobroker.hue-extended' }
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