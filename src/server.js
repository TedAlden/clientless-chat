const net = require("net");
const chalk = require("chalk");
const { Command } = require('commander');
const { version } = require('../package.json');

const DEFAULT_PORT = 5000;

// Command-line arguments
const program = new Command();
program
  .version(version, '-v, --version')
  .option('-p, --port <value>', 'Port', DEFAULT_PORT)
  .parse(process.argv);

const options = program.opts();
const port = options.port;

let clients = [];
let usernames = [];

function logChat (message) {
    process.stdout.write(`${chalk.cyan("[CHAT]")} ${message}\n`);
}

function logInfo (message) {
    process.stdout.write(`${chalk.green("[INFO]")} ${message}\n`);
}

function logWarn (message) {
    process.stdout.write(`${chalk.yellow("[WARN]")} ${message}\n`);
}

// Send a chat message to all clients
function sendChatMessage(message, sender) {
    clients.forEach(function (client) {
        if (client === sender) return;
        if (client.loggedIn == false) return;
        client.write(`<${chalk.magenta(sender.username)}> ${message}\n`);
    });
    logChat(`<${sender.username}> ${message}`);
}

// Send a message to all clients
function sendInfoMessage(message, sender) {
    clients.forEach(function (client) {
        if (client === sender) return;
        if (client.loggedIn == false) return;
        client.write(chalk.grey(`* ${message}\n`));
    });
    logInfo(message);
}

net.createServer((socket) => {
    socket.setEncoding("utf8");
    socket.username;
    socket.loggedIn = false;
    clients.push(socket);

    socket.write(`Your IP: ${socket.remoteAddress}\n`);
    socket.write("Nickname: ");  // Prompt to enter username
    socket.on("data", (data) => {
        let message = data.toString().trim();
        if (message) {
            if (!socket.loggedIn) {
                let username = message.split(" ")[0];
                if (usernames.indexOf(username) > -1) {
                    socket.write(chalk.red("Nickname taken!\n"));
                    socket.write("Nickname: ");
                }
                else {
                    usernames.push(username);
                    socket.username = username;
                    socket.loggedIn = true;
                    socket.write(chalk.greenBright(`Joined as '${username}'.\n`));
                    sendInfoMessage(`${socket.username} joined the chat`, socket);
                }
            }
            else {
                if (message.startsWith("!")) {
                    let argv = message.split(" ");
                    let command = argv[0].slice(1);
                    let params = argv.slice(1, argv.length);
                    if (command != "" & command != null) {
                        console.log(`${chalk.greenBright("[INFO]")} ${socket.username} executed command: ${command}`);
                        if (command == "help") {
                            let msg = `Available Commands:\n- !help\n- !list\n- !nick <new name>\n`;
                            socket.write(chalk.grey(msg));
                        } else if (command == "list") {
                            let msg = `${usernames.length} users online:\n`;
                            usernames.forEach((username) => {
                                msg += `- ${username} (${socket.remoteAddress})\n`;
                            });
                            socket.write(chalk.grey(msg));
                        } else if (command == "nick") {
                            let oldName = socket.username;
                            if (params.length == 0) {
                                socket.write(chalk.red(`Please specify a nickname!\n`));
                                return;
                            }
                            let newName = params[0];
                            if (usernames.indexOf(newName) > -1) {
                                socket.write(chalk.red("Nickname taken!\n"));
                            } else {
                                usernames[usernames.indexOf(oldName)] = newName;
                                socket.username = newName;
                                socket.write(chalk.greenBright(`Now known as '${newName}'.\n`));
                                sendInfoMessage(`${oldName} is now known as ${newName}`, socket);
                            }
                            
                        } else {
                            socket.write(chalk.red(`Unknown command '${command}'. Use !help for a list of commands.\n`));
                        }
                    }	
                } else {
                    sendChatMessage(message, socket);
                }
            }
        }
    });

    socket.on("close", () => {
        clients.splice(clients.indexOf(socket), 1);
        usernames.splice(clients.indexOf(socket.username), 1);
        sendInfoMessage(`${socket.username} left the chat`, socket);
    });

    socket.on("error", (error) => {
        logWarn(error);
    });

    socket.on("timeout", () => {
        socket.end("Socket timed out");
    });
}).listen(port, () => {
    logInfo(`Chat server running on port ${port}`);
});

// TODO: Make server into a class
// TODO: Command handler - each command takes a reference of the server as "this" as a parameter

// TODO: sanitise message data
// TODO: encrypt messages
// TODO: README.md
