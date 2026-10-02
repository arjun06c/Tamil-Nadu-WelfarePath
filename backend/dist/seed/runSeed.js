"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const seedData_1 = require("./seedData");
const run = async () => {
    await (0, db_1.connectDB)();
    await (0, seedData_1.seedDatabase)();
    process.exit(0);
};
run();
