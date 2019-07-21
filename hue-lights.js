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
let bridge, dutyCycle, refreshCycle;

const SUBSCRIPTIONS = ['on', 'sat', 'bri', 'ct', 'hue'];
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

	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', function()
	{
		if (!adapter.config.ip || !adapter.config.user)
		{
			adapter.log.warn('Please provide connection settings for Hue Bridge!');
			return;
		}
		
		// Bridge connection
		bridge = 'http://' + adapter.config.ip + ':' + (adapter.config.port || 80) + '/api/' + adapter.config.user + '/';
		
		// retrieve from Bridge
		refreshCycle = setTimeout(function refresh()
		{
			_request({ uri: bridge, json: true }).then(function(res)
			{
				//adapter.log.debug('Retrieved from data from hue bridge: ' + JSON.stringify(res));
				
				if (adapter.config.syncConfig && res.config !== undefined)
					addBridgeData({ config: res.config });
				
				if (adapter.config.syncGroups && res.groups !== undefined)
					addBridgeData({ groups: res.groups });
				
				if (adapter.config.syncLights && res.lights !== undefined)
					addBridgeData({ lights: res.lights });
				
				if (adapter.config.syncResources && res.resources !== undefined)
					addBridgeData({ resources: res.resources });
				
				if (adapter.config.syncRules && res.rules !== undefined)
					addBridgeData({ rules: res.rules });
				
				if (adapter.config.syncScenes && res.scenes !== undefined)
					addBridgeData({ scenes: res.scenes });
				
				if (adapter.config.syncSchedules && res.schedules !== undefined)
					addBridgeData({ schedules: res.schedules });
				
				if (adapter.config.syncSensors && res.sensors !== undefined)
					addBridgeData({ sensors: res.sensors });
			});
			
			if (adapter.config.refresh > 0 && adapter.config.refresh < 10)
			{
				adapter.log.warn('Refresh rate should not be less than 10s, thus set to 10s.');
				adapter.config.refresh = 10;
			}
			
			if (adapter.config.refresh)
				refreshCycle = setTimeout(refresh, adapter.config.refresh*1000);
			
		}, 1000);
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
		let type = params[0];
		let deviceId = params[1];
		
		// get uid
		adapter.getState(adapterName + '.' + adapter.instance + '.' + type + '.' + deviceId + '.uid', function(err, obj)
		{
			let uid = obj.val;
			params[1] = uid;
			
			let device = getDevice([type, uid]);
			let action = params.splice(params.length-1, 1);
			device.state = params.join('/');
			
			// apply command
			setDevice(device, { [action]: state.val });
		});
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

/**
 *
 */
function addBridgeData(data)
{
	adapter.log.debug('Refreshing ' + Object.keys(data) + '...');
	
	// add meta data
	data.timestamp = Math.floor(Date.now()/1000);
	data.datetime = library.getDateTime(Date.now());
	
	for (let key in data)
	{
		// loop through payload
		readData(key, data[key]);
		
		// index payload
		if (DEVICES[key] !== undefined)
			DEVICES[key] = data[key];
	}
	
	// delete old states (which were not updated in the current payload)
	clearTimeout(dutyCycle);
	dutyCycle = setTimeout(function() {library.runDutyCycle(adapterName + '.' + adapter.instance, data.timestamp)}, 60000);
}

/**
 *
 */
function readData(key, data)
{
	// only proceed if data is given
	if (data === undefined || data === 'undefined')
		return false;
	
	// get node details
	let node = get(key.split('.')); // lights.<NAME/ID>.folder
	
	// loop nested data
	if (data !== null && typeof data == 'object')
	{
		// create channel
		if (Object.keys(data).length > 0)
		{
			if (data.name) data.uid = key.substr(-3).replace(/^0+/, ''); // save uid as state
			
			// use name instead of uid
			let id = false;
			if (data.name && adapter.config.useNames)
			{
				id = data.name.toLowerCase().replace(/ /g, '_');
				key = key.replace(RegExp('\.[0-9]{3}$'), '.' + id);
			}
			
			// create channel
			library.set({
				node: key, role: 'channel', description: id || RegExp('\.[0-9]{3}$').test(key.substr(-4)) ?
					(id ? data.name : 'Index ' + key.substr(key.lastIndexOf('.')+1)) :
					library.ucFirst(key.substr(key.lastIndexOf('.')+1))
			});
		
			// read nested data
			let indexKey;
			for (let nestedKey in data)
			{
				indexKey = nestedKey >= 0 && nestedKey < 100 ? (nestedKey >= 0 && nestedKey < 10 ? '00' + nestedKey : '0' + nestedKey) : nestedKey;
				readData(key + '.' + indexKey, data[nestedKey]); // causes -Unsubscribe from all states, except system's, because over 3 seconds the number of events is over 200 (in last second 0)-
			}
		}
	}
	
	// write to states
	else
	{
		// convert data
		node.key = key;
		//data = convertNode(node, data);
		
		// subscribe to states (if device not indexed yet)
		let device = getDevice(key.split('.'));
		let action = key.substr(key.lastIndexOf('.')+1);
		
		if (device === false && SUBSCRIPTIONS.indexOf(action) > -1)
		{
			node.subscribe = true;
			adapter.subscribeStates(key);
		}
		
		// set data
		library.set(
			{
				node: key,
				type: node.type,
				role: node.role,
				description: node.description,
				common: {
					write: node.subscribe || false
				}
			},
			'' + data
		);
	}
}

/**
 *
 */
function convertNode(node, data)
{
	switch(node.convert)
	{
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
	}
	
	return data;
}

/**
 *
 */
function get(node)
{
	node.splice(1,1);
	return _NODES[library.clean(node.join('.'), true)] || { description: '', role: 'text', type: 'string', convert: null };
}

/**
 *
 */
function getDevice(params)
{
	if (params !== undefined && params[1] !== undefined) params[1] = params[1].replace(/^0+/g, '');
	return DEVICES[params[0]] && DEVICES[params[0]][params[1]] ? DEVICES[params[0]][params[1]] : false;
}

/**
 *
 */
function setDevice(device, actions)
{
	_request({ uri: bridge + device.state, method: 'PUT', json: true, body: actions }).then(function(res)
	{
		if (!Array.isArray(res))
			adapter.log.warn('Unknown error applying action ' + action + ' on device ' + device.name + ' (to ' + device.state + ')!');
		
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
		adapter.log.warn('Failed sending request to Hue Bridge!');
		adapter.log.debug('Error Message: ' + e);
		adapter.log.debug('- device: ' + JSON.stringify(device));
		adapter.log.debug('- uri: ' + bridge + device.state);
		adapter.log.debug('- actions: ' + JSON.stringify(actions));
	});
}

/*
 * COMPACT MODE
 * If started as allInOne/compact mode => return function to create instance
 *
 */
if (module && module.parent)
	module.exports = startAdapter;
else
	startAdapter(); // or start the instance directly
