//const core = require('@actions/core');
//const github = require('@actions/github');
const fs = require('fs')


const path = '../io-package.json';

try {
	if (fs.existsSync(__dirname + '/' + path)) {
		const ioPackage = require(path);
		delete ioPackage.common.installedFrom;
		
		fs.writeFile(__dirname + '/' + path, JSON.stringify(ioPackage, null, 3), err => console.log(err));
	}
}
catch(err) {
	console.error(err)
}