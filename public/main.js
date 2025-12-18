class Page {
    fileInputRef = document.querySelector('#FileInput');
    streamsInputRef = document.querySelector('#streams');
    credInputRef = document.querySelector('#cred');
    intervalRef = document.querySelector('#interval');
    outputRef = document.querySelector('#output');
    statusMessageRef = document.querySelector('#statusMessage');
    startButtonRef = document.querySelector('#start');
    stopButtonRef = document.querySelector('#stop');
    testFileSizeRef = document.querySelector('#testFileSize');
    createTestFileButtonRef = document.querySelector('#createTestFile');
}
class App {
    page = new Page();
    testRunning = false;
    allTimeStamps = [];
    get interval() { return parseInt(this.page.intervalRef.value); }
    get streams() { return parseInt(this.page.streamsInputRef.value); }
    get testFileSize() { return parseFloat(this.page.testFileSizeRef.value); }
    get cred() { return this.page.credInputRef.value; }
    constructor() {
        this.page.startButtonRef.addEventListener('click', () => { this.startTest(); });
        this.page.stopButtonRef.addEventListener('click', () => { this.stopTest(); });
        this.page.createTestFileButtonRef.addEventListener('click', () => { this.createTestFile(); });
        this.getLocalStorageValues();
    }
    startTest() {
        this.testRunning = true;
        this.page.startButtonRef.disabled = true;
        this.page.stopButtonRef.disabled = false;
        let numOfStream = this.streams;
        for (let index = 0; index < numOfStream; index++) {
            this.fileUpload();
        }
        this.setLocalStorageValues();
    }
    stopTest() {
        this.testRunning = false;
        this.page.startButtonRef.disabled = false;
        this.page.stopButtonRef.disabled = true;
    }
    FormatOutput(timeStamps) {
        let markup = '<table class="table table-sm" id="outputTable">';
        markup += `<thead> 
    <tr>
    <th scope="col">Sent</th>
    <th scope="col">Received (UTC)</th>
    <th scope="col">Response (ms)</th>
    <th scope="col">RTT (ms)</th>
    <th scope="col">Size (MB)</th>
    <th scope="col">~Speed (MBps)</th>
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
            row += '<td>' + (x.Speed ? x.Speed.toPrecision(4) : '') + '</td>';
            ;
            return row + '</tr>';
        });
        markup += rows;
        markup += '</tbody></table>';
        return markup;
    }
    async fileUpload() {
        this.setStatusMessage();
        let file = this.page.fileInputRef.files[0];
        if (file == null) {
            this.setStatusMessage('no file selected');
            this.stopTest();
            return;
        }
        let formData = new FormData();
        formData.append('file', file, file.name);
        let timeStamp = {};
        timeStamp.Sent = new Date().toJSON();
        const response = await fetch('/file', {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": 'Basic ' + btoa(this.cred)
            }
        });
        if (response.status == 401) {
            this.setStatusMessage('Invalid Credentials');
            this.stopTest();
            return;
        }
        let body = await response.json();
        timeStamp.Response = new Date().toJSON();
        timeStamp.Received = body.ReceivedUTCTime;
        timeStamp.Size = body.FileSize / 1048576;
        let dateObj = new Date(timeStamp.Sent);
        let newDateObj = new Date(timeStamp.Response);
        timeStamp.RoundTripTime = newDateObj.getTime() - dateObj.getTime();
        timeStamp.Speed = (timeStamp.Size / (timeStamp.RoundTripTime)) * 1000;
        this.allTimeStamps = [timeStamp, ...this.allTimeStamps];
        let parser = new DOMParser();
        let domTable = parser.parseFromString(this.FormatOutput(this.allTimeStamps), "text/html")
            .querySelector('#outputTable')
            .outerHTML;
        this.page.outputRef.innerHTML = domTable;
        if (this.testRunning) {
            setTimeout(() => {
                this.fileUpload();
            }, this.interval);
        }
    }
    setStatusMessage(statusMessage = '') {
        this.page.statusMessageRef.innerHTML = statusMessage;
    }
    setLocalStorageValues() {
        let vals = {
            cred: this.cred,
            interval: this.interval,
            numsOfStream: this.streams
        };
        let valsJSON = JSON.stringify(vals);
        localStorage.setItem('appStorage', valsJSON);
    }
    getLocalStorageValues() {
        let appStorageJSON = localStorage.getItem('appStorage');
        if (!appStorageJSON)
            return;
        let appStorage = JSON.parse(appStorageJSON);
        this.page.credInputRef.value = appStorage.cred;
        this.page.intervalRef.value = appStorage.interval.toString(),
            this.page.streamsInputRef.value = appStorage.numsOfStream.toString();
    }
    createTestFile() {
        let fileSize = Math.trunc(this.testFileSize * 1048576);
        let fileContent = '';
        for (let i = 0; i < fileSize; i++) {
            fileContent += String.fromCharCode(Math.trunc(Math.random() * 128));
        }
        let fileBlob = new Blob([fileContent], { type: "application/text" });
        let aElem = document.createElement('a');
        aElem.download = `TestFile(${this.testFileSize}MB).txt`;
        aElem.href = URL.createObjectURL(fileBlob);
        aElem.click();
        aElem.remove();
    }
}
new App();
export {};
//# sourceMappingURL=main.js.map