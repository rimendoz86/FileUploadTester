class Page {
    fileInputRef = document.querySelector('#FileInput');
    streamsInputRef = document.querySelector('#streams');
    credInputRef = document.querySelector('#cred');
    intervalRef = document.querySelector('#interval');
    outputRef = document.querySelector('#output');
    statusMessageRef = document.querySelector('#statusMessage');
    startButtonRef = document.querySelector('#start');
    stopButtonRef = document.querySelector('#stop');
}
;
class App {
    page = new Page();
    testRunning = false;
    allTimeStamps = [];
    get interval() { return parseInt(this.page.intervalRef.value); }
    constructor() {
        this.page.startButtonRef.addEventListener('click', () => { this.startTest(); });
        this.page.stopButtonRef.addEventListener('click', () => { this.stopTest(); });
        let cred = localStorage.getItem('cred');
        if (cred) {
            this.page.credInputRef.value = cred;
        }
    }
    addTimeStamp(timeStamps, name, dateJSONString, size) {
        let timeStamp = {};
        timeStamp.Event = name;
        timeStamp.TimeStamp = dateJSONString;
        let delta = 0;
        let lastEntry = timeStamps[timeStamps.length - 1];
        if (lastEntry) {
            let dateObj = new Date(lastEntry.TimeStamp);
            let newDateObj = new Date(dateJSONString);
            delta = newDateObj.getTime() - dateObj.getTime();
        }
        timeStamp.Delta = delta;
        if (name == 'Recv' && size) {
            timeStamp.Size = size / 1000000;
            timeStamp.Speed = (timeStamp.Size / (timeStamp.Delta)) * 1000;
        }
        timeStamps.push(timeStamp);
    }
    startTest() {
        this.testRunning = true;
        this.page.startButtonRef.disabled = true;
        this.page.stopButtonRef.disabled = false;
        let numOfStream = parseInt(this.page.streamsInputRef.value);
        for (let index = 0; index < numOfStream; index++) {
            this.fileUpload();
        }
        let cred = this.page.credInputRef.value;
        if (cred) {
            localStorage.setItem('cred', cred);
        }
    }
    stopTest() {
        this.testRunning = false;
        this.page.startButtonRef.disabled = false;
        this.page.stopButtonRef.disabled = true;
    }
    formatOutputNew() {
        let timeStamps = this.allTimeStamps;
        let markup = '<table class="table table-sm" id="outputTable">';
        markup += `<thead> 
    <tr>
    <th scope="col">Event </th>
    <th scope="col">TimeStamp (UTC) </th>
    <th scope="col">Delta (ms) </th>
    <th scope="col">Size (MB)</th>
    <th scope="col">Speed (MBps) </th>
    </tr>
    </thead>
    <tbody>`;
        let rows = timeStamps.map(x => {
            let row = '<tr>';
            row += '<td>' + x.Event + '</td>';
            row += '<td>' + x.TimeStamp + '</td>';
            row += '<td>' + x.Delta + '</td>';
            row += '<td>' + (x.Size ? x.Size.toPrecision(4) : '') + '</td>';
            row += '<td>' + (x.Speed ? x.Speed.toPrecision(4) : '') + '</td>';
            ;
            return row + '</tr>';
        });
        markup += rows;
        markup += '</tbody></table>';
        return markup;
    }
    FormatOutput(timeStamps) {
        let markup = '<table class="table table-sm" id="outputTable">';
        markup += `<thead> 
    <tr>
    <th scope="col">Event </th>
    <th scope="col">TimeStamp (UTC) </th>
    <th scope="col">Delta (ms) </th>
    <th scope="col">Size (MB)</th>
    <th scope="col">Speed (MBps) </th>
    </tr>
    </thead>
    <tbody>`;
        let rows = timeStamps.map(x => {
            let row = '<tr>';
            row += '<td>' + x.Event + '</td>';
            row += '<td>' + x.TimeStamp + '</td>';
            row += '<td>' + x.Delta + '</td>';
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
        let fileInput = this.page.fileInputRef;
        let file = fileInput.files[0];
        if (file == null) {
            this.setStatusMessage('no file selected');
            this.stopTest();
            return;
        }
        let formData = new FormData();
        formData.append('file', file, file.name);
        let timeStamps = [];
        let cred = this.page.credInputRef.value;
        this.addTimeStamp(timeStamps, 'Sent', new Date().toJSON());
        const response = await fetch('/file', {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": 'Basic ' + btoa(cred)
            }
        });
        if (response.status == 401) {
            this.setStatusMessage('Invalid Credentials');
            this.stopTest();
            return;
        }
        let body = await response.json();
        this.addTimeStamp(timeStamps, 'Recv', body.ReceivedUTCTime, body.FileSize);
        this.addTimeStamp(timeStamps, 'Resp', new Date().toJSON());
        this.allTimeStamps = [...timeStamps, ...this.allTimeStamps];
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
}
new App();
export {};
//# sourceMappingURL=main.js.map