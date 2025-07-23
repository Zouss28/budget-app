const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

function getFilePath(name) {
  return path.join(dataDir, `${name}.json`);
}

function readData(name) {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeData(name, data) {
  const filePath = getFilePath(name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readData,
  writeData,
}; 