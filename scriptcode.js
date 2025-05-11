
document.addEventListener('DOMContentLoaded', function() {
    const captureButton = document.getElementById('captureButton');
    const displayContainer = document.getElementById('displayContainer');
    const openRecycleBinButton = document.getElementById('openRecycleBin');
    const recycleBinModal = document.getElementById('recycleBinModal');
    const recycleBinContent = document.getElementById('recycleBinContent');
    const restoreSelectedButton = document.getElementById('restoreSelected');
    const deleteSelectedButton = document.getElementById('deleteSelected');

    // Load stored data
    let storedData = JSON.parse(localStorage.getItem('deviceData')) || [];
    let recycleBin = JSON.parse(localStorage.getItem('recycleBin')) || [];
    displayGroupedData();

    // Predefined device configurations (You'll need to populate this)
    const deviceConfigurations = {
        "iPhone 13 Pro Max": {
            addressBarHeightTop: 80,
            addressBarHeightBottom: 34, // If there's a bottom bar
            browser: "Safari",
        },
        "Samsung Galaxy S21": {
            addressBarHeightTop: 70,
            addressBarHeightBottom: 0,
            browser: "Chrome"
        },
        // Add more devices here
    };

    let environmentType = null;  // Store the selected environment type

    // Function to prompt for environment type and store the value
    function promptForEnvironmentType() {
        environmentType = prompt("Choose Environment:\n1. Physical Device\n2. Virtual Environment\n(Enter 1 or 2)");
        if (environmentType !== '1' && environmentType !== '2') {
            alert("Invalid choice. Please select 1 for Physical Device or 2 for Virtual Environment.");
            promptForEnvironmentType(); // Recursive call to re-prompt
        }
    }

    function getDeviceInfo() {
        let deviceName, screenWidth, screenHeight, physicalSize;

        // Ensure promptForEnvironmentType is called at least once
        if (!environmentType) {
            promptForEnvironmentType();
        }

        const isVirtualEnvironment = environmentType === '2';

        // Capture Viewport + Screen Dimensions
        const actualScreenWidth = screen.width;
        const actualScreenHeight = screen.height;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        const orientation = screen.orientation && screen.orientation.type ? screen.orientation.type : (viewportWidth > viewportHeight ? 'landscape' : 'portrait');
        const desktopMode = actualScreenWidth > 1024; //Use Actual to account for the device,

        if (isVirtualEnvironment) {
            //Get values if in virtual
            deviceName = prompt("Enter Device Name");
            screenWidth = prompt("Screen Width");
            screenHeight = prompt("Screen Height");
            physicalSize = prompt("Physical Size in Inches");
            //Verify the Resolution

            if (parseInt(screenWidth) !== actualScreenWidth || parseInt(screenHeight) !== actualScreenHeight){
                alert(`The Provided dimensions ${screenWidth} x ${screenHeight} do not match what the website is reading
                Which is: ${actualScreenWidth} x ${actualScreenHeight}
                The Provided Screen Dimensions will be used in the Calculations

                Enter Continue to continue using those values
                `);
            }
        } else {
            //Automatically Grab if is not in virtual
            deviceName = "Real Device";
            screenWidth = screen.width
            screenHeight = screen.height;
            physicalSize = "Unknown"
        }

        //Check if our device is present
        let addressBarHeightTop = 0;
        let addressBarHeightBottom = 0;
        let browserName = "Unknown"

        if (deviceConfigurations[deviceName]) {
            addressBarHeightTop = deviceConfigurations[deviceName].addressBarHeightTop;
            addressBarHeightBottom = deviceConfigurations[deviceName].addressBarHeightBottom;
            browserName = deviceConfigurations[deviceName].browser
        } else {
            //Estimate Address Bar height (very rough)
            console.warn(`Device configuration not found for ${deviceName}. Estimating Address Bar height.`);
            if(deviceName.toLowerCase().includes("iphone")) {
              addressBarHeightTop = 80;  // Rough Estimate
            } else {
              addressBarHeightTop = 60;
            }
        }

        //Calculated Effective Viewport
        const effectiveViewportWidth = parseInt(screenWidth);
        const effectiveViewportHeight = viewportHeight - addressBarHeightTop - addressBarHeightBottom; //THIS MUST BE CHANGED

        return {
            deviceName,
            screenWidth,
            screenHeight,
            physicalSize,
            addressBarHeightTop,
            addressBarHeightBottom,
            effectiveViewportWidth,
            effectiveViewportHeight,
            browserName,
            isVirtualEnvironment,
            viewportWidth,
            viewportHeight,
            orientation,
            desktopMode
        };
    }

    function displayData(data, timestamp, index, deviceEntriesContainer) {
        const dataDiv = document.createElement('div');
        dataDiv.classList.add('stored-data-item');

        let innerHTML = '<p><strong>Device:</strong> ' + data.deviceName + '</p>';
        innerHTML += '<p><strong>Selected Environment:</strong> ' + (data.isVirtualEnvironment ? "Virtual" : "Physical") + '</p>';
        innerHTML += '<p><strong>Browser:</strong> ' + data.browserName + '</p>';
        innerHTML += '<p><strong>Screen Resolution:</strong> ' + data.screenWidth + ' x ' + data.screenHeight + '</p>';
        innerHTML += '<p><strong>Orientation:</strong> ' + data.orientation + '</p>';
        innerHTML += '<p><strong>Desktop Mode?:</strong> ' + data.desktopMode + '</p>';
        innerHTML += '<p><strong>Viewport Dimensions:</strong> ' + data.viewportWidth + ' x ' + data.viewportHeight + '</p>';

        innerHTML += '<p><strong>Physical Size:</strong> ' + data.physicalSize + ' inches</p>';
        innerHTML += '<p><strong>Address Bar Height (Top):</strong> ' + data.addressBarHeightTop + ' px</p>';
        innerHTML += '<p><strong>Address Bar Height (Bottom):</strong> ' + data.addressBarHeightBottom + ' px</p>';
        innerHTML += '<p><strong>Effective Viewport:</strong> ' + data.effectiveViewportWidth + ' x ' + data.effectiveViewportHeight + '</p>';
        innerHTML += '<p><strong>Captured On:</strong> ' + timestamp + '</p>';
        dataDiv.innerHTML = innerHTML;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent device group from toggling
            moveDataToRecycleBin(index); //Pass the index here
        });

        dataDiv.appendChild(deleteButton);
        return dataDiv;
    }

    function displayGroupedData() {
        displayContainer.innerHTML = '';
        if (storedData.length === 0) {
            displayContainer.innerHTML = '<p>No data captured yet.</p>';
            return;
        }

        const groupedData = storedData.reduce((acc, item, index) => {
            if (!acc[item.deviceName]) {
                acc[item.deviceName] = {
                    entries: [],
                    indices: []
                };
            }
            acc[item.deviceName].entries.push(item);
            acc[item.deviceName].indices.push(index); //Store the index for each device
            return acc;
        }, {});

        for (const device in groupedData) {
            const deviceEntries = groupedData[device].entries;
            const deviceIndices = groupedData[device].indices; //Get index value for the device

            const deviceGroup = document.createElement('div');
            deviceGroup.classList.add('device-group');

            const deviceSummary = document.createElement('div');
            deviceSummary.classList.add('device-summary');
            deviceSummary.textContent = `${device} (${deviceEntries.length} captures)`;
            deviceGroup.appendChild(deviceSummary);

            const deviceEntriesContainer = document.createElement('div');
            deviceEntriesContainer.classList.add('device-entries');

            deviceEntries.forEach((item, i) => {
                const dataDiv = displayData(item, item.timestamp, deviceIndices[i], deviceEntriesContainer); //Pass the index too for Delete
                deviceEntriesContainer.appendChild(dataDiv);
            });

            deviceGroup.appendChild(deviceEntriesContainer);
            deviceSummary.addEventListener('click', () => {
                deviceEntriesContainer.classList.toggle('expanded');
            });
            displayContainer.appendChild(deviceGroup);
        }
    }

    function moveDataToRecycleBin(index) {
        const data = storedData[index]; // Grab the data
        storedData.splice(index, 1); //Remove from storeData

        // update indices in grouped data after deletion

        recycleBin.push(data); //Add data to RecycleBin

        localStorage.setItem('deviceData', JSON.stringify(storedData));
        localStorage.setItem('recycleBin', JSON.stringify(recycleBin));
        displayGroupedData(); // Refresh storedData display
    }

    //Function to display recycle bin datas
    function displayRecycleBin() {
        recycleBinContent.innerHTML = '';
        if (recycleBin.length === 0) {
            recycleBinContent.innerHTML = '<p>Recycle bin is empty.</p>';
            return;
        }
        recycleBin.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('recycle-bin-item');
            let innerHTML = '<p><strong>Device:</strong> ' + item.deviceName + '</p>';
            innerHTML += '<p><strong>Selected Environment:</strong> ' + (item.isVirtualEnvironment ? "Virtual" : "Physical") + '</p>';
            innerHTML += '<p><strong>Browser:</strong> ' + item.browserName + '</p>';
            innerHTML += '<p><strong>Screen Resolution:</strong> ' + item.screenWidth + ' x ' + item.screenHeight + '</p>';
            innerHTML += '<p><strong>Orientation:</strong> ' + item.orientation + '</p>';
            innerHTML += '<p><strong>Desktop Mode?:</strong> ' + item.desktopMode + '</p>';
            innerHTML += '<p><strong>Viewport Dimensions:</strong> ' + item.viewportWidth + ' x ' + item.viewportHeight + '</p>';

            innerHTML += '<p><strong>Physical Size:</strong> ' + item.physicalSize + ' inches</p>';
            innerHTML += '<p><strong>Address Bar Height (Top):</strong> ' + item.addressBarHeightTop + ' px</p>';
            innerHTML += '<p><strong>Address Bar Height (Bottom):</strong> ' + item.addressBarHeightBottom + ' px</p>';
            innerHTML += '<p><strong>Effective Viewport:</strong> ' + item.effectiveViewportWidth + ' x ' + item.effectiveViewportHeight + '</p>';
           itemDiv.innerHTML = innerHTML;
            const restoreButton = document.createElement('button');
            restoreButton.classList.add('restore-button');
            restoreButton.dataset.index = index; // Store the index
            restoreButton.textContent = 'Restore';
            itemDiv.appendChild(restoreButton);

            recycleBinContent.appendChild(itemDiv);
        });
    }

    //Using event delegation to get the data from the data and properly restore it
    recycleBinContent.addEventListener('click', function(event) {
        if (event.target.classList.contains('restore-button')) {
            const index = parseInt(event.target.dataset.index);
            restoreDataFromRecycleBin(index);
        }
    });

    function restoreDataFromRecycleBin(index) {
        const item = recycleBin[index];
        if (!item) return;

        recycleBin.splice(index, 1); //Remove item from recycleBin
        storedData.push(item); //Add to StoreData

        localStorage.setItem('deviceData', JSON.stringify(storedData));
        localStorage.setItem('recycleBin', JSON.stringify(recycleBin));
        displayGroupedData(); //Refresh Display
        displayRecycleBin();
    }

    function deleteSelectedFromRecycleBin() {
        recycleBin = [];

        localStorage.setItem('recycleBin', JSON.stringify(recycleBin));

        displayRecycleBin();
        displayGroupedData(); // Refresh storedData display
    }

    captureButton.addEventListener('click', function() {
         if (!environmentType) {
            promptForEnvironmentType();
        }
        const currentData = getDeviceInfo();
        const timestamp = new Date().toLocaleString();
        currentData.timestamp = timestamp;

        // **Check for Duplicates**

        //First Compare those values and make sure they are all equal and not one element off,
        const isDuplicate = storedData.some(entry =>
            entry.deviceName === currentData.deviceName &&
            entry.screenWidth === currentData.screenWidth &&
            entry.screenHeight === currentData.screenHeight &&
            entry.viewportWidth === currentData.viewportWidth &&
            entry.viewportHeight === currentData.viewportHeight &&
            entry.physicalSize === currentData.physicalSize &&
            entry.orientation === currentData.orientation &&
            entry.desktopMode === currentData.desktopMode

        );

        if (isDuplicate) {
            alert("This device configuration has already been captured.");
            return; // Don't proceed with capturing
        }

        // Check if data has changed (simplified comparison)
        const lastEntryForDevice = storedData.filter(entry => entry.deviceName === currentData.deviceName).pop();
        if (!lastEntryForDevice ||
            lastEntryForDevice.screenWidth !== currentData.screenWidth ||
            lastEntryForDevice.screenHeight !== currentData.screenHeight ||
            lastEntryForDevice.physicalSize !== currentData.physicalSize) {

            // Store the data
            storedData.push(currentData);
            localStorage.setItem('deviceData', JSON.stringify(storedData));

            displayGroupedData(); // Refresh the grouped display
        } else {
            alert("Device information has not changed since last capture.");
        }
    });

    //Event Listener for Recycle Bin

    openRecycleBinButton.addEventListener('click', function() {
        recycleBinModal.style.display = 'block';
        displayRecycleBin();
    });

    //Close button function on recycleBinModel

    const closeButton = document.querySelector('.close');

    closeButton.addEventListener('click', function() {
        recycleBinModal.style.display = 'none';
    });

    // Restore Button in Modal
    restoreSelectedButton.addEventListener('click', function() {
        deleteSelectedFromRecycleBin();
    });

    // Delete Permanently
    deleteSelectedButton.addEventListener('click', function() {
        deleteSelectedFromRecycleBin();
    });

    // Prevent interaction with elements behind the modal while it's open

    window.addEventListener('click', function(event) {
        if (event.target === recycleBinModal) {
            recycleBinModal.style.display = 'none';
        }
    });
});
