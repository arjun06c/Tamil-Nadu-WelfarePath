"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    try {
        console.log(`[MongoDB] Attempting connection to Atlas URI...`);
        const conn = await mongoose_1.default.connect(env_1.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
        console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    }
    catch (error) {
        console.warn(`\n⚠️ [MongoDB Atlas Auth/Connection Warning]: ${error.message}`);
        console.warn(`⚡ [Auto-Fallback]: Initializing MongoMemoryServer for instant zero-config development...\n`);
        try {
            const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
            const mongod = await MongoMemoryServer.create();
            const memoryUri = mongod.getUri();
            const conn = await mongoose_1.default.connect(memoryUri);
            console.log(`✅ [MongoDB In-Memory DB] Connected successfully at: ${conn.connection.host}`);
            console.log(`💡 Note: To connect to your MongoDB Atlas cluster, update MONGO_URI in backend/.env with your exact <db_username>.\n`);
        }
        catch (memErr) {
            console.error(`❌ [MongoDB Fatal Error]: Could not start memory server fallback: ${memErr.message}`);
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
