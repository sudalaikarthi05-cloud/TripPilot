const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('./node_modules/ffmpeg-static');

const inputFile = path.join(__dirname, 'public/videos/cinematic-bus.mp4');
const outputFile = path.join(__dirname, 'public/videos/cinematic-bus-1080p.mp4');
const posterFile = path.join(__dirname, 'public/videos/cinematic-bus-poster.jpg');
const fontFile = 'C\\:/Windows/Fonts/arialbi.ttf';

console.log('Rendering 100% calibrated TripPilot branded video (1080p, CRF 23)...');

// 1. Arrival: 0.8s to 4.2s
const s1_en = "between(t,0.8,4.2)";
const s1_x = "550-600*pow(max(0,4.2-t)/2.2,1.8)";
const s1_y = "420";

// 2. Stationary: 4.2s to 5.5s & 14.0s to 17.0s
const stat_en = "between(t,4.2,5.5)+between(t,14.0,17.0)";
const stat_x = "550";
const stat_y = "420";

// 3. Dolly-in Zoom: 5.5s to 7.8s
const s3_en = "between(t,5.5,7.8)";
const s3_x = "550-(t-5.5)*135";
const s3_y = "420-(t-5.5)*120";

// 4. Dolly-out Zoom: 13.0s to 14.0s
const s5_en = "between(t,13.0,14.0)";
const s5_x = "550-(14.0-t)*170";
const s5_y = "420-(14.0-t)*160";

// 5. Departure Acceleration: 17.0s to 19.5s (begins at 17.0s, moves 570px/s)
const s7_en = "between(t,17.0,19.5)";
const s7_x = "550+(t-17.0)*570";
const s7_y = "420";

const filterComplex = [
  // 1. Downscale main input to 1080p
  `[0:v] scale=1920:1080 [base]`,

  // 2. Calibrated color patches
  `color=0xF2F4F7:s=780x92:d=24 [p1]`,
  `color=0xF2F4F7:s=780x92:d=24 [p2]`,
  `color=0xF2F4F7:s=880x120:d=24 [p3]`,
  `color=0xF2F4F7:s=880x110:d=24 [p4]`,
  `color=0xF2F4F7:s=880x92:d=24 [p5]`,

  // 3. Overlay patches
  `[base][p1] overlay=x='${s1_x}':y='${s1_y}':enable='${s1_en}' [v1]`,
  `[v1][p2] overlay=x='${stat_x}':y='${stat_y}':enable='${stat_en}' [v2]`,
  `[v2][p3] overlay=x='${s3_x}':y='${s3_y}':enable='${s3_en}' [v3]`,
  `[v3][p4] overlay=x='${s5_x}':y='${s5_y}':enable='${s5_en}' [v4]`,
  `[v4][p5] overlay=x='${s7_x}':y='${s7_y}':enable='${s7_en}' [v5]`,

  // 4. TripPilot & Travels brand text
  // S1 (Arrival)
  `[v5] drawtext=fontfile='${fontFile}':text='TripPilot':x='${s1_x}+30':y='${s1_y}+23':fontsize=48:fontcolor=0x701A24:enable='${s1_en}' [t1]`,
  `[t1] drawtext=fontfile='${fontFile}':text='Travels':x='${s1_x}+305':y='${s1_y}+23':fontsize=48:fontcolor=0x0F172A:enable='${s1_en}' [t2]`,

  // Stationary (4.2-5.5s & 14.0-17.0s)
  `[t2] drawtext=fontfile='${fontFile}':text='TripPilot':x='${stat_x}+30':y='${stat_y}+23':fontsize=48:fontcolor=0x701A24:enable='${stat_en}' [t3]`,
  `[t3] drawtext=fontfile='${fontFile}':text='Travels':x='${stat_x}+305':y='${stat_y}+23':fontsize=48:fontcolor=0x0F172A:enable='${stat_en}' [t4]`,

  // S3 (Zoom-in)
  `[t4] drawtext=fontfile='${fontFile}':text='TripPilot':x='${s3_x}+35':y='${s3_y}+25':fontsize=50:fontcolor=0x701A24:enable='${s3_en}' [t5]`,
  `[t5] drawtext=fontfile='${fontFile}':text='Travels':x='${s3_x}+315':y='${s3_y}+25':fontsize=50:fontcolor=0x0F172A:enable='${s3_en}' [t6]`,

  // S5 (Zoom-out)
  `[t6] drawtext=fontfile='${fontFile}':text='TripPilot':x='${s5_x}+35':y='${s5_y}+25':fontsize=50:fontcolor=0x701A24:enable='${s5_en}' [t7]`,
  `[t7] drawtext=fontfile='${fontFile}':text='Travels':x='${s5_x}+315':y='${s5_y}+25':fontsize=50:fontcolor=0x0F172A:enable='${s5_en}' [t8]`,

  // S7 (Departure)
  `[t8] drawtext=fontfile='${fontFile}':text='TripPilot':x='${s7_x}+30':y='${s7_y}+23':fontsize=48:fontcolor=0x701A24:enable='${s7_en}' [t9]`,
  `[t9] drawtext=fontfile='${fontFile}':text='Travels':x='${s7_x}+305':y='${s7_y}+23':fontsize=48:fontcolor=0x0F172A:enable='${s7_en}' [out]`
].join(';');

const tempOutput = path.join(__dirname, 'public/videos/cinematic-bus-1080p-temp.mp4');

const renderCmd = `"${ffmpeg}" -y -i "${inputFile}" -filter_complex "${filterComplex}" -map "[out]" -map 0:a -c:v libx264 -preset fast -crf 23 -movflags +faststart -c:a copy "${tempOutput}"`;

console.log('Rendering video...');
const startTime = Date.now();
execSync(renderCmd, { stdio: 'inherit' });
const duration = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`Render complete in ${duration}s!`);

if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
fs.renameSync(tempOutput, outputFile);
const stats = fs.statSync(outputFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`Final file size: ${sizeMB} MB (Target: < 15 MB)`);

// Extract crisp poster image at t = 4.5s
const posterCmd = `"${ffmpeg}" -y -ss 00:00:04.5 -i "${outputFile}" -vframes 1 -q:v 2 "${posterFile}"`;
execSync(posterCmd, { stdio: 'inherit' });
console.log('Poster image generated successfully!');
