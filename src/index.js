import Web3 from "web3";
import { contract } from "./services/eth_chain";
import { getProvider, getInstance } from "./services/robonomics_chain";
import { updateAccount, getStake } from "./services/utils";
import prom from "./services/prom";
import logger from "./services/logger";
import express from "express";
import createServer from "./server";
import config from "../config.json";

const app = express();
const server = createServer(app);

prom(app);

server.listen(config.PORT, config.HOST, () => {
  logger.info("Web listening " + config.HOST + " on port " + config.PORT);
});

async function main() {
  const provider = getProvider();
  provider.on("connected", () => logger.info("connected provider"));
  provider.on("error", () => {
    logger.error(`error provider`);
  });
  provider.on("disconnect", () => {
    logger.error(`disconnect provider`);
  });
  await getInstance(provider);
  console.log("app started");

  contract.events
    .Activated()
    .on("data", async function (event) {
      const stake = await getStake(event.returnValues.sender);
      const share = new Web3.utils.BN(stake.amount).div(
        new Web3.utils.BN("100000000000")
      );
      updateAccount(stake.account, share.toString());
    })
    .on("error", function (error, receipt) {
      console.log(error, receipt);
    });
  contract.events
    .Deactivated()
    .on("data", async function (event) {
      const stake = await getStake(event.returnValues.sender);
      updateAccount(stake.account, "0");
    })
    .on("error", function (error, receipt) {
      console.log(error, receipt);
    });
}

main();
