import { updateAll } from "./services/utils";

async function main() {
  console.log("app started");
  return await updateAll();
}

main().then(() => {
  process.exit(0);
});
