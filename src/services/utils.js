import Web3 from "web3";
import { encodeAddress } from "@polkadot/util-crypto";
import { getBandwidth, setBandwidth } from "./robonomics_chain";
import { contract } from "./eth_chain";
import logger from "./logger";

export function addressToRobonomics(account) {
  return encodeAddress(account);
}

export async function updateAccount(account, amount) {
  const r = await setBandwidth(account, amount);
  logger.info(`${account} ${amount}\nblock: ${r.block}\ntx: ${r.tx}`);
}
export async function getStake(sender) {
  const stake = await contract.methods.stakeOf(sender).call();
  stake.account = addressToRobonomics(stake.account);
  return stake;
}

export async function getDeactivatedAccounts() {
  const accounts = [];
  const events = await contract.getPastEvents("Deactivated", { fromBlock: 0 });
  events.forEach((event) => {
    accounts.push(addressToRobonomics(event.returnValues.account));
  });
  return accounts.filter(function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  });
}

export async function updateAll() {
  const deactivatedAccounts = await getDeactivatedAccounts();
  const countAccounts = await contract.methods.activeAccountsLenght().call();
  for (let index = 0; index < countAccounts; index++) {
    const sender = await contract.methods.activeAccountsAt(index).call();
    const stake = await getStake(sender);

    const account = stake.account;
    const bandwidth = await getBandwidth(account);

    if (stake.status !== "1" && bandwidth > 0) {
      // console.log(sender, account, "0");
      await updateAccount(account, "0");
    } else if (stake.status === "1") {
      const share = new Web3.utils.BN(stake.amount).div(
        new Web3.utils.BN("100000000000")
      );
      if (!share.eq(Web3.utils.toBN(bandwidth))) {
        // console.log(sender, account, share.toString(), "up");
        await updateAccount(account, share.toString());
      } else {
        // console.log(sender, account, share.toString(), "skip");
      }
    } else {
      // console.log(sender, account);
    }

    const id = deactivatedAccounts.indexOf(account);
    if (id > -1) {
      deactivatedAccounts.splice(id, 1);
    }
  }
  for (const account of deactivatedAccounts) {
    const bandwidth = await getBandwidth(account);
    if (Number(bandwidth) > 0) {
      await updateAccount(account, "0");
    }
  }
}
