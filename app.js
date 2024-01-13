const SerialPort = require('@serialport/bindings');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/ttyUSB0', {
    baudRate: 9600,
    autoOpen: true, // Specify autoOpen option explicitly
    dataBits: 8,    // Add this option
    stopBits: 1,    // Add this option
    parity: 'none', // Add this option
    rtscts: false,  // Add this option
    xon: false,     // Add this option
    xoff: false,    // Add this option
});

const parser = port.pipe(new Readline({ delimiter: '\n' }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('/*** QU-CD-830 control starting ***/');
const DT = new Date().toLocaleString();
console.log(`Datum: ${DT}`);

parser.on('data', (line) => {
    console.log('Response = ', line.trim());
    check_status(line);
});

port.on('open', async () => {
    console.log(`Serial Port connected on: ${port.path}`);

    while (true) {
        console.log('Key 1 = Version lesen = GV');
        console.log('Key 2 = Dispense = DC');
        console.log('Key 3 = Callback = CP');
        console.log('Key 4 = Status = RF');
        console.log('Key 5 = Step1 (read position) = DH');
        console.log('Key 6 = Step2 (take position) = ES');
        console.log('Key 7 = Eject = FE');
        console.log('Key 8 = Pollbit = PB');
        console.log('Key 9 = Clearbit = PC');
        console.log('Key 0 = Reset = ST');

        const x = await getUserInput('Bitte Tasteneingabe: ');

        if (x === '1') {
            const Befehl = '0247560310'; // Version
            await SendCommand(Befehl);
        } else if (x === '2') {
            const Befehl = '0244430306'; // Dispense
            await SendCommand(Befehl);
        } else if (x === '3') {
            const Befehl = '0243500312'; // Callback
            await SendCommand(Befehl);
        } else if (x === '4') {
            const Befehl = '0252460315'; // Status
            await SendCommand(Befehl);
        } else if (x === '5') {
            const Befehl = '024448030D'; // Step1
            await SendCommand(Befehl);
        } else if (x === '6') {
            const Befehl = '0245530317'; // Step2
            await SendCommand(Befehl);
        } else if (x === '7') {
            const Befehl = '0246550312'; // Eject
            await SendCommand(Befehl);
        } else if (x === '8') {
            const Befehl = '0250420313'; // Pollbit
            await SendCommand(Befehl);
        } else if (x === '9') {
            const Befehl = '0250430312'; // Clearbit
            await SendCommand(Befehl);
        } else if (x === '0') {
            const Befehl = '0253540306'; // Reset
            await SendCommand(Befehl);
        }

        const continueInput = await getUserInput('weiter? (Y/N): ');
        if (continueInput.toLowerCase() !== 'y') {
            break;
        }
    }
});

const SendCommand = async (Befehl) => {
    await sleep(200); // 200ms Pause
    await port.write(Buffer.from(Befehl, 'hex'));
    await sleep(200); // 200ms Pause
    await port.write(Buffer.from('05', 'hex')); // ENQ 0x05
    await sleep(1000);
};

const check_status = (rData) => {
    const Status1 = rData[3];
    console.log('Status_byte1 = ', Status1);
    const Status2 = rData[4];
    console.log('Status_byte2 = ', Status2);
    const Status3 = rData[5];
    console.log('Status_byte3 = ', Status3);

    if (Status1 === 50) {
        console.log('Dispense failure');
        return;
    }

    if (Status1 === 49) {
        console.log('Recycle bin is full');
        return;
    }

    if (Status2 === 50) {
        console.log('Jammed');
        return;
    }

    if (Status2 === 49) {
        console.log('Hopper is lower');
        return;
    }

    if (Status3 === 49) {
        console.log('Card dispenser is not ready');
        return;
    }

    if (Status3 === 50) {
        console.log('Card is in read position');
        return;
    }

    if (Status3 === 52) {
        console.log('Card is in take position');
        return;
    }

    if (Status3 === 56) {
        console.log('Hopper is empty');
        return;
    }

    console.log('Card dispenser is ready');
};

const getUserInput = (question) => {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        readline.question(question, (answer) => {
            readline.close();
            resolve(answer);
        });
    });
};

