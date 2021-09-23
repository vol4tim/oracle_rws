import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import { formatBalance } from "@polkadot/util";
import config from "../../config.json";
import logger from "./logger";

let instance = null;
let provider = null;
let oracleAccount = null;

export function getProvider() {
  if (provider) {
    return provider;
  }
  provider = new WsProvider(config.ROBONOMICS_CHAIN_API);
  return provider;
}

export async function getInstance(provider) {
  if (instance) {
    return new Promise(function (resolve) {
      resolve(instance);
    });
  }
  instance = await ApiPromise.create({
    provider,
    types: config.TYPES,
  });
  return instance;
}

export function getOracleAccount() {
  if (oracleAccount) {
    return oracleAccount;
  }
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
  if (balance <= 1000000000) {
    return Promise.reject(
      new Error(`oracle low balance ${formatBalance(balance)}`)
    );
  }
  const tx = api.tx.rws.setBandwidth(account, share);
  return new Promise(function (resolve, reject) {
    tx.signAndSend(oracle, (result) => {
      if (result.status.isInBlock) {
        result.events.forEach(async (events) => {
          const {
            event: { data, method, section },
            phase,
          } = events;
          if (section === "system" && method === "ExtrinsicFailed") {
            let message = "Error";
            if (data[0].isModule) {
              const mod = data[0].asModule;
              // const mod = result.dispatchError.asModule;
              const { docs, name, section } = mod.registry.findMetaError(mod);
              console.log(name, section, docs);
              message = docs.join(", ");
            }
            return reject(new Error(message));
          } else if (section === "system" && method === "ExtrinsicSuccess") {
            const block = await api.rpc.chain.getBlock(
              result.status.asInBlock.toString()
            );
            resolve({
              block: result.status.asInBlock.toString(),
              blockNumber: block.block.header.number.toNumber(),
              // const index = phase.value.toNumber();
              txIndex: phase.asApplyExtrinsic.toHuman(),
              tx: tx.hash.toString(),
            });
          }
        });
      }
    }).catch(reject);
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
