const main = async () => {

    await hre.run("verify:verify", {
        address: "0x0000000000000000000000000000000000000000000000",
        constructorArguments: [500, "0x0000000000000000000000", ["0x0000000000000000000000"]]
    })
}

const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();