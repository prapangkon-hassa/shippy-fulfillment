import fs from "node:fs";
import readline from "node:readline";
const endpoint = "http://localhost:8931/mcp";
let session = fs.existsSync("qa/mcp-review/session.json") ? JSON.parse(fs.readFileSync("qa/mcp-review/session.json", "utf8")).session : undefined;
let id = 0;
async function request(method, params, notification = false) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(session ? { "Mcp-Session-Id": session } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", ...(notification ? {} : { id: ++id }), method, ...(params ? { params } : {}) }),
  });
  session = response.headers.get("mcp-session-id") || session;
  const text = await response.text();
  if (!response.ok) throw new Error(response.status + " " + text);
  if (!text) return;
  const messages = text.startsWith("event:") ? text.split("\n").filter(line => line.startsWith("data: ")).map(line => JSON.parse(line.slice(6))) : [JSON.parse(text)];
  const message = messages.find(message => message.id === id) || messages.at(-1);
  if (message.error) throw new Error(JSON.stringify(message.error));
  return message.result;
}
if (!session) {
  const info = await request("initialize", {protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"frontend-review",version:"1.0.0"}});
  await request("notifications/initialized", undefined, true);
  fs.writeFileSync("qa/mcp-review/session.json", JSON.stringify({session}));
  console.log("CONNECTED " + info.serverInfo.name);
}
for await (const line of readline.createInterface({input:process.stdin})) {
  if (!line.trim()) continue;
  try {
    const call = JSON.parse(line);
    const result = await request("tools/call", {name:call.name,arguments:call.arguments||{}});
    for (const [index,content] of (result.content||[]).entries()) {
      if(content.type==="image") {const file="qa/mcp-review/capture-"+id+"-"+index+".png";fs.writeFileSync(file,Buffer.from(content.data,"base64"));console.log("IMAGE "+file);}
      else if(content.text) console.log(content.text);
    }
    console.log("DONE "+call.name+" "+(result.isError?"ERROR":"OK"));
  } catch(error) {console.log("ERROR "+error.message);}
}


