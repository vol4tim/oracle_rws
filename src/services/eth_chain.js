import Web3 from "web3";
import logger from "./logger";
import config from "../../config.json";
import ABI from "../../abi/Subscribetion.json";

const provider = new Web3.providers.WebsocketProvider(
  config.ETH_CHAIN_API,
  config.ETH_OPTIONS
);
// provider.on(provider.DATA, (r) => {
//   logger.info(`ETH DATA: ${r}`);
// });
provider.on(provider.CLOSE, (r) => {
  logger.info(`ETH CLOSE: ${r}`);
});
provider.on(provider.ERROR, (r) => {
  logger.warn(`ETH ERROR: ${r}`);
});
provider.on(provider.CONNECT, () => {
  logger.info(`ETH CONNECT`);
});
provider.on(provider.RECONNECT, (r) => {
  logger.info(`ETH RECONNECT: ${r}`);
});

export const web3 = new Web3(provider);

export const contract = new web3.eth.Contract(ABI, config.CONTRACT);
