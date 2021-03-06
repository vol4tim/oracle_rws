import { updateAll } from "./services/utils";

process.on("unhandledRejection", () => {
  process.exit(0);
});

async function main() {
  console.log("app started");
  await updateAll(() => {
    console.log("bad finish");
    process.exit(0);
  });
}

main().then(() => {
  console.log("finish");
  process.exit(0);
});
