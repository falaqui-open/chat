require('dotenv').config();

console.log(`🟡 Initializing system packages...`);
// ... TODO

console.log(`🟡 Initializing system environment...`);
const port              = parseInt(process.env.PORT);
const wssPort           = parseInt(process.env.WSSPORT);

console.log(`🟡 Initializing local packages...`);
// ... TODO

console.log(`🟡 Building routes...`);
// ... TODO

console.log(`🟡 Starting server...`);
// ... TODO

console.log(`🟢 Listening Server on port ${port}. Socket on port ${wssPort}`);