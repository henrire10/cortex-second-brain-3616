export interface GPXPoint {
  lat: number;
  lng: number;
  timestamp?: number;
}

export function buildGpxFromPositions(points: GPXPoint[], name = 'BetzaFit Activity'): string {
  const now = new Date().toISOString();
  const trkpts = points
    .map((p) => `    <trkpt lat="${p.lat}" lon="${p.lng}">${p.timestamp ? `\n      <time>${new Date(p.timestamp).toISOString()}</time>\n    ` : ''}</trkpt>`) 
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="BetzaFit" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <metadata>\n` +
    `    <name>${name}</name>\n` +
    `    <time>${now}</time>\n` +
    `  </metadata>\n` +
    `  <trk>\n` +
    `    <name>${name}</name>\n` +
    `    <trkseg>\n${trkpts}\n    </trkseg>\n` +
    `  </trk>\n` +
    `</gpx>`;
}

export function downloadGpx(filename: string, gpx: string) {
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
