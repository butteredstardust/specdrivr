const fs = require('fs');
const inventory = fs.readFileSync('.custom-components-inventory.txt', 'utf8').trim().split('\n');
console.log(JSON.stringify(inventory, null, 2));
