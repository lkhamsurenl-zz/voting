// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

import voting_artifacts from '../../build/contracts/Voting.json'

// Contstants:
var SEC_IN_MS = 1000;
var MIN_IN_MS = SEC_IN_MS * 60;
var HR_IN_MS = MIN_IN_MS * 60;
var DAY_IN_MS = HR_IN_MS * 24;
var MONTH_IN_MS = 30 * DAY_IN_MS;
var GAS = 140000;

var Voting = contract(voting_artifacts);

let endDate = new Date().getTime() + MONTH_IN_MS;
let candidates = {}

function populateCountdown() {
  Voting.deployed().then(function(contractInstance) {
    contractInstance.getEndTime.call().then(function(date) {
      endDate = new Date(parseInt(date.toString()) * 1000);
    })
  });
}

function updateCountdown() {
  var now = new Date().getTime();
  var distance = endDate - now;

  var days = Math.max(Math.floor(distance / DAY_IN_MS), 0);
  var hours = Math.max(Math.floor((distance % DAY_IN_MS) / HR_IN_MS), 0);
  var minutes = Math.max(Math.floor((distance % HR_IN_MS) / MIN_IN_MS), 0);
  var seconds = Math.max(Math.floor((distance % MIN_IN_MS) / SEC_IN_MS), 0);

  $("#countdown").html(days+"d "+hours+"h "+minutes+"m "+seconds+"s ");
}

var x = setInterval(updateCountdown, 1000);

window.voteForCandidate = function(candidate) {
  var dropDownList = document.getElementById("dropdown-list");
  var candidateName = dropDownList.options[dropDownList.selectedIndex].text;

  try {
    $("#msg").html("Vote has been submitted. The vote count will increment as soon as the vote is recorded on the blockchain. Please wait.")
    $("#error-msg").html("");

    /* Voting.deployed() returns an instance of the contract. Every call
     * in Truffle returns a promise which is why we have used then()
     * everywhere we have a transaction call
     */
    Voting.deployed().then(function(contractInstance) {
      contractInstance.voteForCandidate(
        candidateName, 
        { gas: GAS, from: web3.eth.accounts[0] }
      ).then(function() {
        let div_id = candidates[candidateName];
        return contractInstance.totalVotesFor.call(candidateName).then(function(v) {
          $("#" + div_id + "-vote").html(v.toString());
          $("#msg").html("");
        });
      }).catch(function(err) {
        // if voting session has ended, show the message
        contractInstance.hasEnded.call().then(function(expired) {
          if (expired) {
            // Finalize the voting process.
            contractInstance.getWinner.call().then(function(winnerId) {
              $("#winner").html("Voting has finished. " + winnerId.toString() + " won!" +
                " Smart contract will automatically release fund to the winner.");
            })
            $("#error-msg").html("Voting session has expired!");
          } else {
            $("#error-msg").html("You have already casted a vote!");
          }
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
}

function populateCandidates() {
  Voting.deployed().then(function(contractInstance) {
    contractInstance.getCandidateList.call().then(function(candidateArray) {
      for(let i=0; i < candidateArray.length; i++) {
        /* We store the candidate names as bytes32 on the blockchain. We use the
         * handy toUtf8 method to convert from bytes32 to string
         */
        candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i;
      }
      setupCandidateRows();
      setupDropdownList();
      populateCandidateLinks();
      populateCandidateVotes();
    });
  });
}

// Construct html of candidate rows with their information. 
function setupCandidateRows() {
  Object.keys(candidates).forEach(function (candidate) { 
    let nameTd = "<td>" + candidate + "</td>"
    let linkTd = "<td id='" + candidates[candidate] + "-link'></td>"
    let voteTd = "<td id='" + candidates[candidate] + "-vote'></td>"
    $("#candidate-rows").append("<tr>" + nameTd + linkTd + voteTd + "</tr>");
  });
}

function setupDropdownList() {
  Object.keys(candidates).forEach(function (candidate) { 
    // <option value="volvo">Volvo XC90</option>
    $("#dropdown-list").append("<option value='" + candidate + "'>" + candidate + "</option>");
  });
}

function populateCandidateLinks() {
  let candidateNames = Object.keys(candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    Voting.deployed().then(function(contractInstance) {
      contractInstance.getCandidateSubmissionLink.call(name).then(function(v) {
        let link = "<a href='https://www.youtube.com/watch?v=" + v.toString() + "'>link</a>";
        $("#" + candidates[name] + "-link").html(link);
      });
    });
  }
}

function populateCandidateVotes() {
  let candidateNames = Object.keys(candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    Voting.deployed().then(function(contractInstance) {
      contractInstance.totalVotesFor.call(name).then(function(v) {
        $("#" + candidates[name] + "-vote").html(v.toString());
      });
    });
  }
}

$( document ).ready(function() {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  Voting.setProvider(web3.currentProvider);
  populateCountdown();
  populateCandidates();

});
