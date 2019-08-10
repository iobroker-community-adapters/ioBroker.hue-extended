![Logo](admin/hue-extended.png)
# ioBroker.hue-extended
Connect your Philips Hue Lights with ioBroker.

![Number of Installations](http://iobroker.live/badges/hue-extended-installed.svg)
![Stable version](http://iobroker.live/badges/hue-extended-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.hue-extended.svg)](https://www.npmjs.com/package/iobroker.hue-extended)
[![Travis CI](https://travis-ci.org/Zefau/ioBroker.hue-extended.svg?branch=master)](https://travis-ci.org/Zefau/ioBroker.hue-extended)
[![Downloads](https://img.shields.io/npm/dm/iobroker.hue-extended.svg)](https://www.npmjs.com/package/iobroker.hue-extended)
[![Greenkeeper badge](https://badges.greenkeeper.io/Zefau/ioBroker.hue-extended.svg)](https://greenkeeper.io/)

[![NPM](https://nodei.co/npm/iobroker.hue-extended.png?downloads=true)](https://nodei.co/npm/iobroker.hue-extended/) 


**Table of contents**
1. [Features](#1-features)
2. [Setup instructions](#2-setup-instructions)
3. [Channels & States](#3-channels--states)
4. [Changelog](#changelog)
5. [Licence](#license)


## 1. Features
- Synchronize Config
- Synchronize Groups
- Synchronize Lights
- Synchronize Resources
- Synchronize Rules
- Synchronize Scenes
- Synchronize Schedules
- Synchronize Sensors 
- Trigger changes on states `on/off`, `bri` (`level`), `hue`, `sat`, `xy`, `ct`, `alert`, `effect` and `transitiontime`  

## 2. Setup instructions
tbd

## 3. Channels & States
tbd

## Changelog

### 1.0.0 (2019-xx-xx) [MILESTONES / PLANNED FEATURES FOR v1.0.0 RELEASE]
- implement user creation in interface configuration (admin panel)
- implement bridge discovery in interface configuration (admin panel)

### 0.4.0 (2019-08-10)
- (Zefau) Fixed applying action on group

### 0.4.0 (2019-08-09)
- (Zefau) Renamed adapter to hue-extended (formerly hue-lights)
- (Zefau) Changed roles of some states

### 0.3.2 (2019-08-07)
- (Zefau) Refactored data retrieval and state creation

### 0.3.1 (2019-08-03)
- (Zefau) When turning on a device, set level / bri to 100 if it was set to 0

### 0.3.0 (2019-08-03)

__REMARK: If you are coming from an earlier version, please delete all your hue-extended states before running this release!__

- (Zefau) Added error message when incorrect bridge credentials are provided ([see issue description](https://forum.iobroker.net/post/287505))
- (Zefau) When turning off a device, set level / bri to 0 ([see issue description](https://forum.iobroker.net/post/287566))
- (Zefau) Fixed error that prevented `groups` being set / changed
- (Zefau) Added specific role information to states under `lights`, `groups` and `sensors` ([see issue description](https://forum.iobroker.net/post/287566))
- (Zefau) Fixed wrong value for temperature sensors ([see issue description](https://forum.iobroker.net/post/287564))

### 0.2.0 (2019-07-24)
- (Zefau) Added support to change states _level_, _xy_, _effect_, _alert_, and _transitiontime_

### 0.1.0 (2019-07-21)
- (Zefau) Retrieve lights, groups, resourcelinks, rules, scenes, schedules, sensors and config from Hue Bridge
- (Zefau) Change states (e.g. on/off, brightness, saturation)


## License
The MIT License (MIT)

Copyright (c) 2019 Zefau <zefau@mailbox.org>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
