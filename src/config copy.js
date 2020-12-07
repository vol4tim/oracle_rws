export default {
  DEBUG: process.env.DEBUG
    ? process.env.DEBUG.trim().toLowerCase() === "true"
    : false,

  HOST: process.env.HOST || "127.0.0.1",
  PORT: process.env.PORT || "3000",

  ETH_CHAIN_API:
    process.env.ETH_CHAIN_API ||
    "wss://rinkeby.infura.io/ws/v3/ceec7d81fbdb41e8b8b9e7c27ab91c79",
  ROBONOMICS_CHAIN_API:
    process.env.ROBONOMICS_CHAIN_API || "ws://127.0.0.1:9944",
  CONTRACT:
    process.env.CONTRACT || "0x3BD98A58930eE3a360493aA081758b36E263Bd49",
  ORACLE: process.env.ORACLE || "//Alice",
};
