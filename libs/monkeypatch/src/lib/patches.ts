import * as crypto from "crypto";

if (global.crypto == null) {
  global.crypto = crypto;
}
