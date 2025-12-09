/*
TODO:
- figure out how useful custom cloudinit files are. see "cicustom" in pve docs to get where i need to for.
- using exec() is SUCH A HACKY WAY TO DO IT. it directly exposes the command line and is some type of vulnerability, 
plus the child processes DO NOT GO AWAY UNLESS THE SERVER IS STOPPED. 
*/




// Load environment variables from .env file -AI agent
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

import proxmoxApi from 'proxmox-api';
import { exec } from 'child_process';


// ID of the template VM to clone from -AI agent
const VMTEMPLATE = 101;

const targetNode = "sierra"

// IP address of the Proxmox host server -AI agent
const targetIP = "192.168.1.4"

// Utility function to introduce delays in async code to wait for VM initialization -AI agent
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 


export async function create(nVMID) {  
    // Initialize connection to Proxmox API -AI agent
    const pve = proxmoxApi({host: targetIP, tokenID: "root@pam!test", tokenSecret:"4fd6bbdc-2333-4194-aa25-56317d0c67be", port: 8006})
    
    // Extract numeric portion of the VMID for use in clone naming -AI agent
    var cloneID = nVMID.toString().slice(1,nVMID.length);
   
    // Clone the template VM to create a new VM with the specified VMID -AI agent
    const clone = await pve.nodes.$(targetNode).qemu.$(VMTEMPLATE).clone.$post({
        newid: nVMID,  
        node: targetNode, 
        vmid: VMTEMPLATE, 
        description: "cloned from the server!", 
        name: "clone-" + cloneID})
        
        
    // Retrieve the status of the newly cloned VM -AI agent
    const cloneStatus = await pve.nodes.$(targetNode).qemu.$(nVMID).status.current.$get();

    console.log(`created clone VM ${nVMID}...`);
    // Wait for VM clone to complete before proceeding -AI agent
    await delay(5000);
   // Start the cloned VM -AI agent
   const start =  await pve.nodes.$(targetNode).qemu.$(nVMID).status.start.$post({node: targetNode, vmid: nVMID})

   console.log("Opening vncproxy...");

   // Wait for VM startup and VNC service initialization -AI agent
   await delay(10000); 

    // Create a VNC proxy connection with auto-generated password -AI agent
    const vncproxy = await pve.nodes.$(targetNode).qemu.$(nVMID).vncproxy.$post({node: targetNode, vmid: nVMID, websocket: 1, "generate-password": 1})

    // Extract VNC connection details from the proxy response -AI agent
    const vncPort = vncproxy.port;
    const vncCert = vncproxy.cert;
    const vncTicket = vncproxy.ticket;
    const vncPassword = vncproxy.password;
    
    console.log(vncproxy);

    console.log("creating websocket URL...");
   
    // Establish the VNC WebSocket connection -AI agent
    const vncwebsocket = await pve.nodes.$(targetNode).qemu.$(nVMID).vncwebsocket.$get({node: targetNode, vncticket: vncTicket, port: vncPort, vmid: nVMID});

    console.log("using novnc_proxy to open a proxy...");
    
    
    // Write VNC certificate to a temporary file -AI agent
    exec(`echo "${vncCert}" > /tmp/cert-${nVMID}.pem`)
    // Launch noVNC proxy to bridge VNC and WebSocket connections 
    exec(`/opt/server/server/public/noVNC/utils/novnc_proxy --vnc ${targetIP}:${vncPort} --cert /tmp/cert-${nVMID}.pem --listen 17${cloneID} &`,
    function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
             console.log('exec error: ' + error);
        }
    });

    // Construct and return the VNC access URL with authentication -AI agent
    var url = `http://192.168.1.51:17${cloneID}/vnc.html?autoconnect=1&reconnect=1#password=${encodeURI(vncPassword)}`
    return url;
}

