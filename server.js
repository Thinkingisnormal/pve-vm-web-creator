/*
  __     __   _  _    ____   __    ___  __ _  ____  __ _  ____ 
 (  )   / _\ ( \/ )  (  _ \ / _\  / __)(  / )(  __)(  ( \(    \
  )(   /    \/ \/ \   ) _ (/    \( (__  )  (  ) _) /    / ) D (
 (__)  \_/\_/\_)(_/  (____/\_/\_/ \___)(__\_)(____)\_)__)(____/          
*/


//TODO: make it so the server only accepts localhost IP address.

//making a backend for the front end to send information to.
//this backend will probably talk to 
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';	
import slist from './serverconf.json' assert {type: "json"} // requires the json of servers..
const app = express();


// Required to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static HTML/JS/CSS files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());


global.vmcount = 0; //how many VMs we have made through the web app.




//start server
app.listen(10477, () => {
  console.log(`Backend is running on port 10477.`);
});

/*
  __   ____  __    ____  __ _  ____  ____   __  __  __ _  ____  ____  _   
 / _\ (  _ \(  )  (  __)(  ( \(    \(  _ \ /  \(  )(  ( \(_  _)/ ___)(_)  
/    \ ) __/ )(    ) _) /    / ) D ( ) __/(  O ))( /    /  )(  \___ \ _   
\_/\_/(__)  (__)  (____)\_)__)(____/(__)   \__/(__)\_)__) (__) (____/(_)  


*/


//ping
app.get('/ping', (req, res) => {
    res.json({ message: "Hello from server!" });
});


//create(VMID,targetNode,targetIP,VMTEMPLATE)

import { create } from './vm-scripts/vm-creation.js';
import { assert } from 'console';
app.get('/createvnc', async (_, res) => {
  global.vmcount = global.vmcount + 1;
if (global.vmcount < 7) {
	  const url = await create(300 + global.vmcount, slist[1].name, slist[1].ip,slist[1].cloneid).catch(console.error);
	  console.log(url);
	  res.json({ url });
	  console.log(`Total vm count: ${global.vmcount}`)
	}
else if (global.vmcount < 13) {
	const url = await create(300 + global.vmcount, slist[2].name, slist[2].ip, slist[2].cloneid).catch(console.error);
	console.log(url);
	res.json({url});
	console.log(`Total vm count: ${global.vmcount} (switched to ${foxtrot.name})`)
	}
else {
	res.json({message: `uh oh! looks like the VM count has reached its limit (${VMlimit} VMs) please tell us.`})
}
});

//whenever the proxmox API returns an error (usually because the VMID is taken) it will redirect to here
app.get('/undefined', (req, res) => {
    res.json({ message: "uh oh! tell diel that you got undefined. Proabably because a VMID is taken..." });
});

app.get('/full', (req, res) => {
	res.json({message: `uh oh! looks like the VM count has reached its limit (${VMlimit} VMs) please tell us.`})
});
