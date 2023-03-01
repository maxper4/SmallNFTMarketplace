const main = async () => {

    await hre.run("verify:verify", {
        address: "0x8fdE95803c5959bcc8480D27fEC732d0Cc405DC9",
        constructorArguments: []
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