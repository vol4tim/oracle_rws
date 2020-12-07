import Web3 from "web3";
import config from "../config";
import ABI from "../../abi/Subscribetion.json";

export const web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.ETH_CHAIN_API)
);

export const contract = new web3.eth.Contract(ABI, config.CONTRACT);
