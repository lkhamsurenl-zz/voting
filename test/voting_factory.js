var VotingFactory = artifacts.require("./VotingFactory.sol");

contract('VotingFactory', function(accounts) {

  function arraysEqual(a1, a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
  }

  it("should initialize with first 6 candidates", function() {
    return VotingFactory.deployed().then(function(instance) {
      return instance.getCandidateList.call();
    }).then(function(bytesArray) {
      var actual = bytesArray.map(x => web3.toUtf8(x));
      var expected = ['LJ', 'Forest', 'Jieying', 'Wenjie', 'Peng', 'Yin'];

      assert.equal(
        arraysEqual(actual, expected), 
        true, 
        "getCandidateList did not return expected list"
      );
    });
  });

  it("should return winner", function() {
    return VotingFactory.deployed().then(function(instance) {
      return instance.getCandidateList.call().then(function(list) {
        var candidate = list[0];
        return instance.voteForCandidate.call(candidate).then(function() {
          console.log("Finished voting!");
        });
      });
    });
  });
});
