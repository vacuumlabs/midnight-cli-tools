import * as crypto from "crypto";
import {WebSocket} from "node:http";

if (global.crypto == null) {
  global.crypto = crypto;
}

if (global.WebSocket == null) {
  global.WebSocket = WebSocket;
}
