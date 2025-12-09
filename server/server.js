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
const app = express();

global.vmcount = 0;



// Required to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static HTML/JS/CSS files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());


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


// import { create } from '/opt/server/server/vm-scripts/vm-creation.js';
import { create } from './vm-scripts/vm-creation.js';
app.get('/createvnc', async (_, res) => {
  global.vmcount = global.vmcount + 1;
  const url = await create(300 + global.vmcount).catch(console.error);
  console.log(url);
  res.json({url:url})
});