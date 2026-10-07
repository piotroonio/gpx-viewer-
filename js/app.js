console.log("APP START");

const map = L.map('map').setView([52.1, 19.4], 6);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap'
    }
).addTo(map);

let trackLayer = null;

const fileInput = document.getElementById('gpxFile');

fileInput.addEventListener('change', (e) => {
console.log("PLIK WYBRANY");
handleGPX(e);
});

async function handleGPX(event) {

    const file = event.target.files[0];

    if (!file) return;

    document.getElementById('fileName').textContent =
        file.name;

    const text = await file.text();

    const parser = new DOMParser();

    const xml =
        parser.parseFromString(text, "application/xml");

    parseGPX(xml);
}

function parseGPX(xml) {

    const trkpts = xml.querySelectorAll("trkpt");
    let startTime = null;
    let endTime = null;

    const firstTimeNode =
    trkpts[0]?.querySelector("time");

    const lastTimeNode =
    trkpts[trkpts.length - 1]?.querySelector("time");

if (firstTimeNode) {
    startTime = new Date(firstTimeNode.textContent);
}

if (lastTimeNode) {
    endTime = new Date(lastTimeNode.textContent);
}

    if (!trkpts.length) {

        alert("Brak punktów trasy GPX");

        return;
    }

    const latlngs = [];

    let totalDistance = 0;
    let totalElevationGain = 0;

    let previous = null;
    let previousEle = null;

    trkpts.forEach(point => {

        const lat =
            parseFloat(point.getAttribute("lat"));

        const lon =
            parseFloat(point.getAttribute("lon"));

        const eleNode =
            point.querySelector("ele");

        const ele =
            eleNode
            ? parseFloat(eleNode.textContent)
            : 0;

        latlngs.push([lat, lon]);

        if (previous) {

            totalDistance += calculateDistance(
                previous.lat,
                previous.lon,
                lat,
                lon
            );
        }

        if (
            previousEle !== null &&
            ele > previousEle
        ) {

            totalElevationGain +=
                ele - previousEle;
        }

        previous = {
            lat,
            lon
        };

        previousEle = ele;
    });

    if (trackLayer) {
        map.removeLayer(trackLayer);
    }

    trackLayer = L.polyline(
        latlngs,
        {
            color: '#ff3b30',
            weight: 5
        }
    ).addTo(map);

    map.fitBounds(trackLayer.getBounds());

    document.getElementById('distance')
        .textContent =
        `${(totalDistance / 1000).toFixed(2)} km`;

    document.getElementById('elevation')
        .textContent =
        `${Math.round(totalElevationGain)} m`;

    document.getElementById('points')
        .textContent =
        trkpts.length;
        if (startTime) {

        document.getElementById('startTime')
        .textContent =
        startTime.toLocaleString('pl-PL');
        }

        if (endTime) {

        document.getElementById('endTime')
        .textContent =
        endTime.toLocaleString('pl-PL');
        }
}

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;

    const dLon =
        (lon2 - lon1) *
        Math.PI /
        180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}
