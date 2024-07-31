import { logDOM } from '@testing-library/react';
import './App.css';
import { useState, useEffect, useRef } from 'react'
import './styles/utils.css'; // Import the CSS file

import { Container, Button, ButtonGroup, Row, Col, ProgressBar } from 'react-bootstrap';

import proj4 from 'proj4';
import { saveAs } from 'file-saver';

// Define the projection for EPSG:32616
// const fromProj = '+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs';

// Define the projection for GPS (WGS84)
const toProj = '+proj=longlat +datum=WGS84 +no_defs';




export function Utils() {
  console.log('Hello!');

  // const [webtake, setWebtake] = useState('')


  // Get current date and previous month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const prevMonth = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthName = prevMonth.toLocaleString('default', { month: 'long' });
  const prevMonthYear = prevMonth.getFullYear();



  // utilsList = [{'name': 'Convert GeoJSON to KML'}];



//  /////////////////////////////////////////////////////////

  // const [gpsCoordinates, setGpsCoordinates] = useState([]);
  const [fileKML, setFileKML] = useState([]);
  const [fileContent, setFileContent] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const content = JSON.parse(e.target.result);
            setFileContent(content);
        } catch (error) {
            alert('Invalid JSON file');
        }
    };
    
    reader.readAsText(file);
};

  // const crsCoordinates = [
  //   [
  //     [725379.3038082123, 3768168.620048523, 264.10428619384766],
  //     [725408.2565879822, 3768162.065887451, 264.09234619140625],
  //     [725417.1921863556, 3768185.344787598, 264.07579803466797],
  //     [725384.1456737518, 3768197.250579834, 264.0871810913086],
  //     [725379.3038082123, 3768168.620048523, 264.10428619384766]
  //   ]
  // ];
  // console.log('comparing coords coordinates:');
  // console.log(crsCoordinates);

  const convertCoordinates = (coordinatesOriginal, fromProj) => {
    console.log('Received coordinates:');
    console.log(coordinatesOriginal);
    return coordinatesOriginal.map(orig => orig.map(([x, y, z]) => {
        const [lon, lat] = proj4(fromProj, toProj, [x, y]);
        return [lon, lat, z];
    })
    );
  };


  const getProjStringFromCrsString = (crsString) => {
    const match = crsString.match(/EPSG::(\d+)/);
    if (match) {
        const epsgCode = match[1];
        // return `+init=EPSG:${epsgCode}`;
        return `EPSG:${epsgCode}`;
    } else {
        throw new Error('Invalid CRS string format');
    }
  };


  function convertGeoJSONToKML() {
    // const fileInput = document.getElementById('geojsonInput');
    // const file = fileInput.files[0];
    // console.log(file.name);
    // data_name = file.name.split('.')[0]
    // if (!file) {
    //   alert('Please select a GeoJSON file first.');
    //   return;
    // }


    
    if (!fileContent) {
      alert('Please upload a file first');
      return;
    }
    console.log('Received file:');
    console.log(fileContent);
    const geojson = fileContent

    // const geojson = fileContent.map(polygon =>
    //   polygon.map(([x, y, z]) => {
    //     const [lon, lat] = proj4(fromProj, toProj, [x, y]);
    //     return [lon, lat, z];
    //   })
    // );

    // const geojson = JSON.parse(fileContent);
    console.log('Parsed input file:');
    console.log(geojson);

    // data_name = fileContent.name.split('.')[0];
    // console.log(data_name);
    // setGpsCoordinates(converted);
    const data_name = 'some_file';
    const kml = createKML(geojson, data_name);
    setFileKML(kml);

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    saveAs(blob, data_name + '.kml');
  };

  function createKML(geojson, data_name) {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    kml += `<kml xmlns="http://www.opengis.net/kml/2.2">\n`;
    kml += `<Document>\n`;
      kml += `<name>` + data_name + `</name>\n`;
    
    kml += `<Folder><name>Photos</name>\n`;

    let coordsLine = ``;

    const fromCRS = getProjStringFromCrsString(geojson.crs.properties.name); // "urn:ogc:def:crs:EPSG::32616";

    for (const feature of geojson.features) {
      console.log('Current feature:');
      console.log(feature);
      
      // kml += `<Placemark>\n`;

      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates;

        const coordinatesConverted = convertCoordinates(coords, fromCRS);
        console.log('Converted coords:');
        console.log(coordinatesConverted);
  
        // kml += `<Point>\n`;
        // kml += `<coordinates>${coordinatesConverted[0]},${coordinatesConverted[1]},${coordinatesConverted[2]}</coordinates>\n`;
        // kml += `</Point>\n`;


        if (feature.geometry.type === 'Polygon') {
          // for (const coordinates of coordinatesConverted) {
          coordinatesConverted.forEach((coordinatesArray, index) => {
            coordinatesArray.forEach((coordinates, index) => {
              kml += `<Placemark>\n`;
              if (feature.properties.Photo) {
                kml += `<name>${feature.properties.Photo}</name>\n`;
              } else {
                kml += `<name>Photo ${index + 1}</name>\n`;
              }
              console.log('Current coords: ', coordinates);
              kml += `<Point>\n`;
              // kml += `<altitudeMode>absolute</altitudeMode>\n`;
              kml += `<coordinates>${coordinates[0]},${coordinates[1]},${coordinates[2]}</coordinates>\n`;
              coordsLine += ` ${coordinates[0]},${coordinates[1]},${coordinates[2]} ` + ' ';
              // coordsLine += ' ';
              kml += `</Point>\n`;
              kml += `</Placemark>\n`;
            })
            })
          // }
        }
        // Add support for more geometry types as needed
      }

      // kml += `</Placemark>\n`;
    }
    kml += `</Folder>\n`;

    
    kml += `<Placemark>\n`;
    kml += `<name>Path</name>\n`;
    kml += `<LineString>\n`;
    // kml += `<coordinates>` + geojson.features.map(feature => `${feature.geometry.coordinates[0]},${feature.geometry.coordinates[1]},${feature.geometry.coordinates[2]}`).join(' ') + `</coordinates>\n`;
    
    kml += `<coordinates>` + coordsLine + `</coordinates>\n`;
    kml += `</LineString>\n`;
    kml += `</Placemark>\n`;
    

    kml += `</Document>\n`;
    kml += `</kml>\n`;

    return kml;
  };


  return (
    <div className="container">
      <h1>GeoJSON to KML Converter</h1>
      <input type="file" id="geojsonInput" accept=".json, .geojson" onChange={handleFileUpload}/>
      <button onClick={convertGeoJSONToKML}>Convert to KML</button>
      {/* <button onClick={convertCoordinates}>Convert to KML</button> */}
      {/* <br><br> */}
      
      {fileKML.length > 0 && (
        <div>
          <h2>Converted Coordinates (GPS)</h2>
          {/* <pre>{JSON.stringify(gpsCoordinates, null, 2)}</pre> */}
          <pre>{fileKML}</pre>
        </div>
      )}

      {/* <h1>GeoJSON to KML Converter</h1>
      <input type="file" id="geojsonInput" accept=".json, .geojson" onChange={handleFileUpload}>
      <button onclick={convertGeoJSONToKML}>Convert to KML</button>
      <br><br>
      <a id="downloadLink" class="hidden">Download KML</a> */}
    </div>



  );







}