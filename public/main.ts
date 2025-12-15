interface AppStorage {
    cred: string;
    interval: number;
    numsOfStream: number;
}
interface TimeStamp {
    Event: string;
    TimeStamp: string;
    Delta: number;
    Size: number;
    Speed: number;
}
interface TimeStampNew {
    Sent: string;
    Received: string;
    Response: string;
    Size: number,
    Speed: number,
    RoundTripTime: number;
}

class Page {
    fileInputRef = <HTMLInputElement>document.querySelector('#FileInput')
    streamsInputRef = <HTMLInputElement>document.querySelector('#streams');
    credInputRef = <HTMLInputElement>document.querySelector('#cred');
    intervalRef = <HTMLInputElement>document.querySelector('#interval');
    outputRef = <HTMLElement>document.querySelector('#output');
    statusMessageRef = <HTMLElement>document.querySelector('#statusMessage');
    startButtonRef = <HTMLButtonElement>document.querySelector('#start');
    stopButtonRef = <HTMLButtonElement>document.querySelector('#stop');
};


class App {
    readonly page = new Page();
    public testRunning = false;
    public allTimeStamps = <TimeStampNew[]>[]
    get interval(){return parseInt(this.page.intervalRef!.value)}
    get streams(){return parseInt(this.page.streamsInputRef.value)}
    get cred(){return this.page.credInputRef.value}
    constructor(){
        this.page.startButtonRef.addEventListener('click', () => {this.startTest()})
        this.page.stopButtonRef.addEventListener('click', ()=>{this.stopTest()})
        this.getLocalStorageValues();
    }

    public addTimeStamp(timeStamps: TimeStamp[], name: string, dateJSONString: string, size?: number) {
        let timeStamp: Partial<TimeStamp> = {};
        timeStamp.Event = name;
        timeStamp.TimeStamp = dateJSONString;

        let delta = 0;
        let lastEntry = timeStamps[timeStamps.length - 1];
        if (lastEntry) {
            let dateObj = new Date(lastEntry.TimeStamp);
            let newDateObj = new Date(dateJSONString);
            delta = newDateObj.getTime() - dateObj.getTime()
        }
        timeStamp.Delta = delta;


        if (name == 'Recv' && size) {
            timeStamp.Size = size / 1000000;
            timeStamp.Speed = (timeStamp.Size / (timeStamp.Delta)) * 1000
        }
        timeStamps.push(<TimeStamp>timeStamp)
    }

    public startTest() {
        this.testRunning = true;
        this.page.startButtonRef.disabled = true
        this.page.stopButtonRef.disabled = false;
        let numOfStream = this.streams;
        for (let index = 0; index < numOfStream; index++) {
            this.fileUpload();
        }
        this.setLocalStorageValues();

    }

    public stopTest() {
        this.testRunning = false;
        this.page.startButtonRef.disabled = false
        this.page.stopButtonRef.disabled = true;
    }

    public FormatOutput(timeStamps: TimeStampNew[]) {
        let markup = '<table class="table table-sm" id="outputTable">'

        markup += `<thead> 
    <tr>
    <th scope="col">Sent </th>
    <th scope="col">Received (UTC) </th>
    <th scope="col">Response (ms) </th>
    <th scope="col">RoundTripTime (ms) </th>
    <th scope="col">Size (MB)</th>
    <th scope="col">~Speed (MBps) </th>
    </tr>
    </thead>
    <tbody>`;

        let rows = timeStamps.map(x => {
            let row = '<tr>';
            row += '<td>' + x.Sent + '</td>';
            row += '<td>' + x.Received + '</td>';
            row += '<td>' + x.Response + '</td>';
            row += '<td>' + x.RoundTripTime + '</td>';
            row += '<td>' + (x.Size ? x.Size.toPrecision(4) : '') + '</td>';
            row += '<td>' + (x.Speed ? x.Speed.toPrecision(4) : '') + '</td>';;
            return row + '</tr>'
        })
        markup += rows;
        markup += '</tbody></table>'
        return markup;
    }

    public async fileUpload() {
        this.setStatusMessage()
        let file = this.page.fileInputRef.files![0];
        if (file == null) {
            this.setStatusMessage('no file selected');
            this.stopTest();
            return;
        }
        let formData = new FormData();
        formData.append('file', file, file.name)

        let timeStampNew: Partial<TimeStampNew> = {};
        timeStampNew.Sent = new Date().toJSON();
        //this.addTimeStamp(timeStamps, 'Sent', new Date().toJSON())
        const response = await fetch('/file', {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": 'Basic ' + btoa(this.cred)
            }
        })

        if (response.status == 401) {
            this.setStatusMessage('Invalid Credentials');
            this.stopTest();
            return;
        }
        let body = await response.json()
        timeStampNew.Received = body.ReceivedUTCTime;
        timeStampNew.Size = body.FileSize / 1000000
        timeStampNew.Response = new Date().toJSON();
        let dateObj = new Date(timeStampNew.Sent);
        let newDateObj = new Date(timeStampNew.Response);
        timeStampNew.RoundTripTime = newDateObj.getTime() - dateObj.getTime()
        timeStampNew.Speed = (timeStampNew.Size / (timeStampNew.RoundTripTime)) * 1000

        this.allTimeStamps = [<TimeStampNew>timeStampNew, ...this.allTimeStamps];


        let parser = new DOMParser();
        let domTable = parser.parseFromString(this.FormatOutput(this.allTimeStamps), "text/html")!
            .querySelector('#outputTable')!
            .outerHTML;
        this.page.outputRef.innerHTML = domTable

        if (this.testRunning) {
            setTimeout(() => {
                this.fileUpload()
            }, this.interval);
        }
    }

    public setStatusMessage(statusMessage = '') {
        this.page.statusMessageRef.innerHTML = statusMessage

    }

    setLocalStorageValues(){
        let vals: AppStorage  = {
            cred: this.cred,
            interval: this.interval,
            numsOfStream: this.streams
        }
        let valsJSON = JSON.stringify(vals);
        localStorage.setItem('appStorage', valsJSON);
    }
    getLocalStorageValues(){
        let appStorageJSON = localStorage.getItem('appStorage');
        if(!appStorageJSON) return;
        let appStorage:AppStorage = JSON.parse(appStorageJSON);

        this.page.credInputRef.value = appStorage.cred;
        this.page.intervalRef.value = appStorage.interval.toString(),
        this.page.streamsInputRef.value = appStorage.numsOfStream.toString()
    }
}
/*
for later to build a file on command instead of providing a specific file.
var sumstring = ''
for (let i = 0; i<1024; i++){
    sumstring+=String.fromCharCode( parseInt(Math.random()*128))
}
console.log(sumstring.length);
let file = new Blob([sumstring])
let href = URL.createObjectURL(file);
let a = document.createElement('a');
a.download = 'file.txt';
a.href = href;
a.click()
delete a;
*/
new App()
