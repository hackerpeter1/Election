App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForVoteEvents();
      //App.listenForAddEvents();
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForVoteEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      var judge = 0;
      instance.votedEvent({}, {
        fromBlock: '0',    // render the html as the latest block has votedEvent
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("Vote event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });

      /*instance.addEvent({}, {
        fromBlock: 'latest',
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("Add event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });*/
    });
  },

    // Listen for events emitted from the contract
    listenForAddEvents: function() {
      App.contracts.Election.deployed().then(function(instance) {
        // Restart Chrome if you are unable to receive this event
        // This is a known issue with Metamask
        // https://github.com/MetaMask/metamask-extension/issues/2393
        instance.addEvent({}, {
          fromBlock: 'latest',
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("Add event triggered", event)
          // Reload when a new vote is recorded
          App.render();
        });
      });
    },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();
      //$('#candidatesResults').empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();
      for (var i = 1; i <= candidatesCount; i++) {
        // test
        // console.log(candidatesCount);
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var birth = candidate[2];
          var introduction = candidate[3];
          var voteCount = candidate[4];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td><td>" + birth + "</td><td>" + 
                                     "<button id = \"test\" style=\"background-color:rgb(105,105,105)\" type=\"button\" class=\"btn btn-default\" title=\"Introduction\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"top\" data-content=\"" + introduction + "\">" +
                                      "..."+
                                     "</button>" +
                                   "</td></tr>"; 
          // var candidateTemplate = "<tr><td>" + 
          //                           "<button id = \"test\" style=\"background-color:rgb(105,105,105)\" type=\"button\" class=\"btn btn-default\" title=\"Introduction\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"top\" data-content=\"" + introduction + "\">" +
          //                             "<table><tbody><tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount +  "</td></tr></tbody></table>" +
          //                           "</button>" +
          //                         "</td></tr>"; 
          //var candidateTemplate = 	"<button type=\"button\" class=\"btn btn-default\" title=\"Popover title\" data-container=\"body\" data-toggle=\"popover\" data-placement=\"left\" data-content=\"左侧的 Popover 中的一些内容\">左侧的 Popover</button>";
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // This is important!!!!
      // Because it has added a new button with the attribute popover, but 
      // it hasn't excuate popover() function, so we must call it again.
      $("[data-toggle='popover']").popover();
      // Do not allow a user to vote
      if(hasVoted) {
        $("#voteform").hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  addCandidate: function() {
    var candidateName = $('#candidateName').val();
    var candidateBirth = $('#candidateBirth').val();
    var candidateIntroduction = $('#candidateIntroduction').val();
    //test
    //console.log("CandidateName:" + candidateName)
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addCandidate(candidateName, candidateBirth, candidateIntroduction);
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $("[data-toggle='popover']").popover();
  $(window).load(function() {
    App.init();
  });
});