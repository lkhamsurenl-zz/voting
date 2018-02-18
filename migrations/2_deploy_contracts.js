var Voting = artifacts.require("./VotingFactory.sol");
module.exports = function(deployer) {
	// TODO(LJ): Eventually should be reading from Forest's contract.
	let startDate = Math.floor(Date.now() / 1000);
	// expire in a minute.
	let endDate = Math.floor(Date.now() / 1000) + 30;

  deployer.deploy(
  	Voting, 
  	['LJ', 'Forest', 'Jieying', 'Wenjie', 'Peng', 'Yin'], 
  	['uOHDkIxyu2A', 'RH2zwpV4Akk', 'P22gcb4YHso', 'HgtIWyfekhw', 'yib7tvIrL6k', 'JHeHt-U1OvM'], 
  	startDate, 
  	endDate,
  	{gas: 2700000}
  );
};
/* As you can see above, the deployer expects the first argument to   be the name of the contract followed by constructor arguments. In our case, there is only one argument which is an array of
candidates. The third argument is a hash where we specify the gas required to deploy our code. The gas amount varies depending on the size of your contract.
*/