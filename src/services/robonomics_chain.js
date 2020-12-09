import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import config from "../config";
import logger from "./logger";

let instance = null;
let oracleAccount = null;

export function getInstance() {
  if (instance) {
    return new Promise(function (resolve) {
      resolve(instance);
    });
  }
  const provider = new WsProvider(config.ROBONOMICS_CHAIN_API);
  return ApiPromise.create({
    provider,
    types: config.TYPES,
  }).then((r) => {
    instance = r;
    return r;
  });
}

export function getOracleAccount() {
  if (oracleAccount) {
    return oracleAccount;
  }
  const keyring = new Keyring({ type: "sr25519" });
  oracleAccount = keyring.addFromUri(config.ORACLE, { name: "Oracle" });
  return oracleAccount;
}

export async function setBandwidth(account, share) {
  const api = await getInstance();
  const oracle = getOracleAccount();
  const tx = api.tx.rws.setBandwidth(account, share);
  return new Promise(function (resolve, reject) {
    let unsub;
    tx.signAndSend(oracle, (result) => {
      if (result.status.isFinalized) {
        unsub();
        resolve({
          block: result.status.asFinalized.toString(),
          tx: tx.hash.toString(),
        });
      }
    })
      .then(function (r) {
        unsub = r;
      })
      .catch(function (e) {
        reject(e);
      });
  });
}

export async function getBandwidth(account) {
  const api = await getInstance();
  try {
    return await api.query.rws.bandwidth(account);
  } catch (e) {
    logger.error(e.message);
    return 0;
  }
}
