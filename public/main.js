function addTimeStamp(timeStamps = [], name = '', dateJSONString = '') {
    let delta = 0;
    if (timeStamps.length != 0) {
        let lastEntry = timeStamps[timeStamps.length - 1];
        let dateObj = new Date(lastEntry.TimeStamp);
        let newDateObj = new Date(dateJSONString);
        delta = newDateObj.getTime() - dateObj.getTime()
    }
    timeStamps.push({ Event: name, TimeStamp: dateJSONString, Delta: delta })
}

async function fileUpload() {
    document.querySelector('#output').value = '';
    let fileInput = document.querySelector('#FileInput')
    let file = fileInput.files[0];

    let formData = new FormData();
    formData.append('file', file, file.name)
    
    let timeStamps = [];
    addTimeStamp(timeStamps, 'Sent', new Date().toJSON())
    const response = await fetch('/file', {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": 'Basic ' + btoa('user1:pass1')
        }
    })
    let body = await response.json()
    addTimeStamp(timeStamps, 'ServerReceived', body.ReceivedUTCTime)
    addTimeStamp(timeStamps, 'Response', new Date().toJSON())
    document.querySelector('#output').value = JSON.stringify(timeStamps);

}