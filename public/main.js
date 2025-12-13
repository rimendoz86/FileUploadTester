const page = {
    startButtonRef: document.querySelector('#start'),
    fileInputRef: document.querySelector('#FileInput'),
    statusMessageRef: document.querySelector('#statusMessage'),
    interval: 1000,
}
allTimeStamps = [];

function addTimeStamp(timeStamps = [], name = '', dateJSONString = '', size = null) {
    let timeStamp = {};
    timeStamp.Event = name;
    timeStamp.TimeStamp = dateJSONString;

    let delta = 0;
    if (timeStamps.length != 0) {
        let lastEntry = timeStamps[timeStamps.length - 1];
        let dateObj = new Date(lastEntry.TimeStamp);
        let newDateObj = new Date(dateJSONString);
        delta = newDateObj.getTime() - dateObj.getTime()
    }
    timeStamp.Delta = delta;


    if (name == 'Recv'){
        timeStamp.Size = size/1000000;
        timeStamp.Speed = (timeStamp.Size/(timeStamp.Delta)) * 1000
    }
    timeStamps.push(timeStamp)
}

function FormatOutput(timeStamps) {
    let markup = '<table class="table table-sm" id="outputTable">'

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
        row += '<td>'+ x.Event + '</td>';
        row += '<td>'+ x.TimeStamp + '</td>';
        row += '<td>'+ x.Delta + '</td>';
        row += '<td>'+ (x.Size ? x.Size.toPrecision(4) : '') + '</td>';
        row += '<td>'+ (x.Speed ? x.Speed.toPrecision(4): '') + '</td>';    ;
        return row + '</tr>'
    })
    markup += rows;
    markup += '</tbody></table>'
    return markup;
}

async function fileUpload() {

    setStatusMessage()
    let fileInput = page.fileInputRef;
    let file = fileInput.files[0];
    if(file == null) {
        setStatusMessage('no file selected');
        return;
    }
    page.startButtonRef.disabled = true;
    let formData = new FormData();
    formData.append('file', file, file.name)
    
    let timeStamps = [];
    let cred = localStorage.getItem('cred');

    addTimeStamp(timeStamps, 'Sent', new Date().toJSON())
    const response = await fetch('/file', {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": 'Basic ' + btoa(cred)
        }
    })

    if(response.status == 401){
        setStatusMessage('Invalid Auth, Set auth in localStorage');
        page.startButtonRef.disabled = false;
        return;
    }
    let body = await response.json()

    addTimeStamp(timeStamps, 'Recv', body.ReceivedUTCTime, body.FileSize);
    addTimeStamp(timeStamps, 'Resp', new Date().toJSON());

    allTimeStamps = [...timeStamps,...allTimeStamps];

    let parser = new DOMParser();
    let domTable = parser.parseFromString(FormatOutput(allTimeStamps), "text/html")
                            .querySelector('#outputTable')
                            .outerHTML;
    document.querySelector('#output').innerHTML = domTable
    page.startButtonRef.disabled = false;
    if(document.querySelector('#repeat').checked){
        setTimeout(() => {
            fileUpload()
        }, page.interval);
    }
}

function setStatusMessage(statusMessage = ''){
    page.statusMessageRef.innerHTML = statusMessage

}