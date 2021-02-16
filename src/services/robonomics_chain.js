import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import { formatBalance } from "@polkadot/util";
import config from "../../config.json";
import logger from "./logger";

let instance = null;
let provider = null;
let oracleAccount = null;

export function getProvider() {
  return provider;
}

export function getInstance() {
  if (instance) {
    return new Promise(function (resolve) {
      resolve(instance);
    });
  }
  provider = new WsProvider(config.ROBONOMICS_CHAIN_API);
  // provider.on("connected", () => {
  //   console.log("connected");
  // });
  // provider.on("disconnected", () => {
  //   console.log("disconnected");
  // });
  // provider.on("error", () => {
  //   console.log("error");
  // });
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
  // const keyring = new Keyring({ type: "sr25519", ss58Format: 32 });
  const keyring = new Keyring({ type: "sr25519" });
  keyring.setSS58Format(instance.registry.chainSS58);
  oracleAccount = keyring.addFromUri(config.ORACLE, { name: "Oracle" });
  return oracleAccount;
}

export async function getBalance(account) {
  if (!provider.isConnected) {
    return Promise.reject(new Error(`Not connected`));
  }
  const result = await instance.query.system.account(account);
  return Number(result.data.free);
}

export function addressToRobonomics(account) {
  return encodeAddress(account, instance.registry.chainSS58);
}

export async function setBandwidth(account, share) {
  const api = await getInstance();
  if (!provider.isConnected) {
    return Promise.reject(new Error(`Not connected`));
  }
  const oracle = getOracleAccount();
  const balance = await getBalance(oracle.address);
  // const balance = await getBalance(
  //   "4HQk933sAspxah4pP9kHmxLZNHjxrFLa1vM1VC4ESsSLyos4"
  // );
  if (balance <= 1000000000) {
    return Promise.reject(
      new Error(`oracle low balance ${formatBalance(balance)}`)
    );
  }
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
  if (!provider.isConnected) {
    return Promise.reject(new Error(`Not connected`));
  }
  try {
    return await api.query.rws.bandwidth(account);
  } catch (e) {
    logger.error(e.message);
    return 0;
  }
}
