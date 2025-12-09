//TODO: figure out how useful custom cloudinit files are. see "cicustom" in pve docs to get where i need to for.
 
//makes envirnment variables work

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

import { exec } from 'child_process';

import proxmoxApi from 'proxmox-api';
import { escape } from 'querystring';


var nVMID = 308; 

const VMTEMPLATE = 101; //specify the template here

const targetNode = "sierra"

const targetIP = "192.168.1.4" //probably can make it so we can find the target node IP thru pve API 

//to give me a function to delay the asnyncronous code as there is no way to know if the VM has finish being fully initialized.
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 


export async function create() {
    const pve = proxmoxApi({host: targetIP, tokenID: "root@pam!test", tokenSecret:"4fd6bbdc-2333-4194-aa25-56317d0c67be", port: 8006})

    var cloneID = nVMID.toString().slice(1,nVMID.length);

    const clone = await pve.nodes.$(targetNode).qemu.$(VMTEMPLATE).clone.$post({
        newid: nVMID,  
        node: targetNode, 
        vmid: VMTEMPLATE, 
        description: "cloned from the server!", 
        name: "clone-" + cloneID})
        
        
    
    const cloneStatus = await pve.nodes.$(targetNode).qemu.$(nVMID).status.current.$get();

    console.log("created clone VM...");
    await delay(5000); //5 second delay
   // const config = await pve.nodes.$(targetNode).qemu.$(nVMID).config.$post({node: targetNode, vmid: nVMID, args: "-vnc 0.0.0.0:"+ cloneID})
   
   const start =  await pve.nodes.$(targetNode).qemu.$(nVMID).status.start.$post({node: targetNode, vmid: nVMID})

   console.log("Opening vncproxy...")
    await delay(10000); 
   
   const vncproxy = await pve.nodes.$(targetNode).qemu.$(nVMID).vncproxy.$post({node: targetNode, vmid: nVMID, websocket: 1, "generate-password": 1})

    const vncPort = vncproxy.port;
    const vncCert = vncproxy.cert;
    const vncTicket = vncproxy.ticket;
    const vncPassword = vncproxy.password;
    
    console.log(vncproxy)

    console.log("creating websocket URL...");
   
   const vncwebsocket = await pve.nodes.$(targetNode).qemu.$(nVMID).vncwebsocket.$get({node: targetNode, vncticket: vncTicket, port: vncPort, vmid: nVMID});

   console.log(vncwebsocket);

    const url = `wss://${targetIP}:8006/api2/json/nodes/${targetNode}/qemu/${nVMID}` +
  `/vncwebsocket?node=${targetNode}&port=${vncPort}&vmid=${nVMID}&vncticket=${vncTicket}`;
    
    console.log("VNC WebSocket URL:", url);
    return url;
}

