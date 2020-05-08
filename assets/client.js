(() => {
  //Block - XCStats login
  var loginToXCStats = firebase.functions().httpsCallable('loginToXCStats');

  var $xcStatsLoginButton = document.querySelector("#xu-cl-xcstats-loginButton"),
    $xcStatsLoginForm = document.querySelector("#xu-cl-xcstats-loginForm"),
    $emailInput = document.querySelector("#xu-cl-xcstats-email"),
    $passwordInput = document.querySelector("#xu-cl-xcstats-password"),
    $submitButton = document.querySelector("#xu-cl-xcstats-submitButton"),
    $errorAlert = document.querySelector("#xu-cl-xcstats-loginError"),
    $stravaLoginButton = document.querySelector("#xu-cl-strava-loginButton");

  $xcStatsLoginButton.onclick = () => {
    [$xcStatsLoginButton].forEach(($el) => $el.disabled = true);
    $xcStatsLoginForm.classList.remove("d-none");
  };

  $xcStatsLoginForm.onsubmit = (submitEvent) => {
    submitEvent.preventDefault();

    $errorAlert.classList.add("d-none");
    $submitButton.disabled = true;

    var payload = {
      email: $emailInput.value,
      password: $passwordInput.value
    };

    loginToXCStats(payload).then((response) => {
      // console.log(response);
      $errorAlert.innerText = "";
      $xcStatsLoginForm.classList.add("d-none");
      [$submitButton, $emailInput, $passwordInput, $stravaLoginButton].forEach(($el) => $el.disabled = false);
    }).catch((error) => {
      // console.error(error);
      $errorAlert.innerText = "Incorrect e-mail or password.";
      $errorAlert.classList.remove("d-none");
      [$xcStatsLoginButton, $emailInput, $passwordInput].forEach(($el) => $el.disabled = true);
    });

    setTimeout(() => {
      if ($errorAlert.innerText == "") {
        $errorAlert.innerText = "Sorry, this is taking a bit...";
        $errorAlert.classList.remove("d-none");
      }
    }, 3000);
  }
})();

(() => {
  //BLOCK — Strava Log in
  var getStravaLoginURL = firebase.functions().httpsCallable("getStravaLoginURL");

  var $stravaLoginButton = document.querySelector("#xu-cl-strava-loginButton"),
    $stravaLoginError = document.querySelector("#xu-stravaLoginError");

  $stravaLoginButton.onclick = () => {
    $stravaLoginButton.disabled = true;
    firebase.auth().currentUser.getIdToken(true).then((token) => {
      getStravaLoginURL({
        token: token,
        developerMode: location.hostname == "localhost"
      }).then((url) => {
        // console.log(url);
        location.assign(url.data);
      }).catch((loginURLError) => {
        $stravaLoginError.innerText = JSON.stringify(loginURLError);
        $stravaLoginError.classList.remove("d-none");
        $stravaLoginButton.disabled = false;
        console.error(loginURLError);
      });
      setTimeout(() => {
        if ($stravaLoginError.innerText == "") {
          $stravaLoginError.innerText = "Retrieving the URL from the server...";
          $stravaLoginError.classList.remove("d-none");
          setTimeout(() => {
            if ($stravaLoginError.innerText == "Retrieving the URL from the server...") {
              $stravaLoginError.innerHTML = "Sorry, this is taking a bit...";
              $stravaLoginError.classList.remove("d-none");
            }
          }, 3000);
        }
      }, 1000);
    }).catch((idTokenError) => {
      $stravaLoginError.innerHTML = "Something went wrong retrieving your Google log-in token. Please try again or <a href='mailto:stassinopoulosari@gmail.com'>send me an email</a>.";
      $stravaLoginError.classList.remove("d-none");
      $stravaLoginButton.disabled = false;
      console.error(idTokenError);
    });
  };

})();

(() => {
  //BLOCK — Login Flow

  var $xcStatsLoginButton = document.querySelector("#xu-cl-xcstats-loginButton"),
    $stravaLoginButton = document.querySelector("#xu-cl-strava-loginButton"),
    $stravaLoginError = document.querySelector("#xu-stravaLoginError"),
    $logoutButton = document.querySelector("#xu-signOutButton");

  $logoutButton.onclick = () => firebase.auth().signOut().then(() => {
    location.assign("..")
  });

  firebase.auth().onAuthStateChanged(() => {

    if (!firebase.auth().currentUser) setTimeout(() => location.assign(".."), 1100);

    var $loginFlow = document.querySelector("#xu-cl-loginFlow"),
      $main = document.querySelector("#xu-cl-main");

    firebase.firestore().doc("users/" + firebase.auth().currentUser.uid).get().then((userDataSnapshot) => {
      firebase.firestore().doc("users/" + firebase.auth().currentUser.uid).set({
        displayName: firebase.auth().currentUser.displayName
      }, {
        merge: true
      });
      var userData = userDataSnapshot.data();
      // console.log(userData);

      if (userData && (userData["markers.hasLoggedInWithXCStats"] &&
          userData["markers.hasLoggedInWithXCStats"].status == true &&
          userData["markers.hasLoggedInWithStrava"] &&
          userData["markers.hasLoggedInWithStrava"].status == true) ||
        location.search.includes("stravaAuthSucceeded")) {
        $xcStatsLoginButton.disabled = true;
        $stravaLoginButton.disabled = true;
        $main.classList.remove("d-none");
        mainBlock.startMainBlock();
      } else if (userData && userData["markers.hasLoggedInWithXCStats"] && userData["markers.hasLoggedInWithXCStats"].status == true) {
        $xcStatsLoginButton.disabled = true;
        $stravaLoginButton.disabled = false;
        $loginFlow.classList.remove("d-none");
        var search = location.search;
        $stravaLoginError.classList.remove("d-none");
        if (search.includes("stravaAuthError=incorrectScope")) {
          $stravaLoginError.innerText = "Sorry, we need to be able to see your private activities. We don't save your Strava data anywhere except your own computer.";
        } else if (search.includes("stravaAuthError=firebaseError")) {
          $stravaLoginError.innerHTML = "Sorry, we couldn't save your Strava token. Please try again or <a href='mailto:stassinopoulosari@gmail.com'>send me an email</a>.";
        } else if (search.includes("stravaAuthError=httpError")) {
          $stravaLoginError.innerHTML = "Sorry, we couldn't verify your Google log-in token. Please try again or <a href='mailto:stassinopoulosari@gmail.com'>send me an email</a>.";
        } else {
          $stravaLoginError.classList.add("d-none");
        }
      } else {
        $loginFlow.classList.remove("d-none");
      }
    }).catch((error) => console.error(error));


  });

})();

var mainBlock = (() => {
  //BLOCK — main

  var cache = {};

  (() => {
    var cacheContents = localStorage.getItem("xu-cacheContents");
    if (!cacheContents) return;

    cacheContents = JSON.parse(cacheContents);
    if (!cacheContents.ts || (new Date().getTime() - cacheContents.ts) > (6 * 60 * 60 * 1000)) return;

    cache = cacheContents;

  })();

  var saveCache = () => {
    cache.ts = new Date().getTime();
    localStorage.setItem("xu-cacheContents", JSON.stringify(cache));
  };

  var clearCache = () => {
    localStorage.clear();
  };

  var createElementFromHTML = function(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
  }

  return {
    startMainBlock: () => {
      var downloadStravaActivities = () => {
        if (cache.activities) return Promise.resolve(cache.activities);
        return firebase.functions().httpsCallable("downloadStravaActivities")();
      }
      var getTwoWeeksOfLogs = (data) => {
        if (cache.logs) return Promise.resolve(cache.logs);
        return firebase.functions().httpsCallable("getTwoWeeksOfLogs")(data);
      };

      var $downloadingHeader = document.querySelector("#xu-cl-stravaDownloadingHeader"),
        $downloadingInfo = document.querySelector("#xu-cl-downloadingInfo"),
        $activitiesList = document.querySelector("#xu-cl-stravaActivitiesList"),
        $activitiesSummary = document.querySelector("#xu-cl-activitiesSummary"),
        $clearCacheButton = document.querySelector("#xu-cl-clearCacheButton");

      $clearCacheButton.onclick = () => {
        clearCache();
        location.reload();
      }

      $downloadingHeader.classList.remove("d-none");
      $activitiesSummary.classList.add("d-none");
      var dayTemplate = document.querySelector("#template-day").innerHTML,
        activityTemplate = document.querySelector("#template-activity").innerHTML;
      Promise.all([getTwoWeeksOfLogs({
          date: new Date()
        }).then((logData) => {
          $downloadingInfo.innerText += " XCStats downloading done. Downloading Strava activities...";
          cache.logs = logData;
          return logData;
        }).catch((logError) => console.error(logError)),
        downloadStravaActivities().then((stravaData) => {
          $downloadingInfo.innerText += " Strava downloading done. Downloading XCStats logs...";
          cache.activities = stravaData;
          return stravaData;
        }).catch((stravaError) => console.error(stravaError))
      ]).then((values) => {
        var logData = values[0],
          stravaData = values[1];

        saveCache();

        $downloadingInfo.innerText += "";

        //Logs

        logData = logData.data;
        var $cells = [].slice.call(document.querySelectorAll(".xu-logDisplay .xu-logDisplay-contentRow .col:not([class*=xu-hh])"));
        for (var i = 0; i < 7; i++) {
          var $lastWeekCell = $cells[i + 7];
          var $thisWeekCell = $cells[i];
          var sum = [logData.lastWeekLog[i].log.reduce((acc, el) => acc + el, 0), logData.thisWeekLog[i].log.reduce((acc, el) => acc + el, 0)];
          [$lastWeekCell, $thisWeekCell].forEach(($cell, sumIndex) => {
            $cell.style.backgroundColor = sum[sumIndex] == 0 ? "#FFF" : sum[sumIndex] == 1 ? "#888" : "#000"
            $cell.innerText = sum[sumIndex] == 0 ? "0" : sum[sumIndex] == 1 ? "1" : "2";
          });
        }
        var combinedLogs = [],
          dateIndexedLogs = {};
        [logData.lastWeekLog, logData.thisWeekLog].forEach((logs) => {
          logs.forEach((log) => combinedLogs.push(log));
        });
        combinedLogs = combinedLogs.map((log, i) => {
          var date = new Date(log.date);
          var dateString = ((date.getMonth() + 1) + "").padStart(2, "0") +
            "/" +
            ((date.getDate()) + "").padStart(2, "0") +
            "/" +
            (date.getYear() + 1900);
          log.date = dateString;
          return log;
        }).forEach((log) => {
          dateIndexedLogs[log.date] = log.log.reduce((acc, el) => acc + el, 0);
        });

        //Strava Activities

        var days = {},
          activities = stravaData.data;

        console.log(activities);

        activities.forEach((activity) => {
          var date = new Date(activity.date);
          var dateString = ((date.getMonth() + 1) + "").padStart(2, "0") +
            "/" +
            ((date.getDate()) + "").padStart(2, "0") +
            "/" +
            (date.getYear() + 1900);
          if (days[dateString]) {
            days[dateString].push(activity);
          } else days[dateString] = [activity];
        });

        var datesOutputString = "";

        for (var date in days) {
          var dateActivities = days[date];
          datesOutputString += dayTemplate
            .replace(/%date%/g, date)
            .replace(/%activities%/g, dateActivities.map((activity) => {
              var $el = createElementFromHTML(activityTemplate
                .replace(/%title%/g, activity.title)
                .replace(/%summary%/g, "distance: " + activity.distance.toFixed(1) +
                  " miles; moving time: " +
                  Math.floor(activity.movingTime / 60) + " minutes and " +
                  (activity.movingTime % 60 + "").padStart(2, "0") + " seconds")
                .replace(/%type%/g, activity.type)
                .replace(/%url%/g, "https://strava.com/activities/" + activity.id).replace(/%disabled%/g, dateIndexedLogs[date] == 2 ? "disabled" : ""));

              // console.log($el);
              $el.querySelector(".selectorBox").setAttribute("data-activitydata", JSON.stringify({
                date: date,
                activity: activity
              }));

              return $el.outerHTML;
            }).join(""));
        }

        $activitiesList.innerHTML = datesOutputString;
        $downloadingHeader.classList.add("d-none");
        $activitiesSummary.classList.remove("d-none");

        var selection = [];
        var resolveAddBox = () => {
          if (selection.length == 0) {
            [].slice.call(document.querySelectorAll(".addBox")).forEach(($el) => {
              $el.disabled = true;
              $el.classList.add("d-none")
            });
          } else {
            document.querySelector(".addBox[data-date='" + selection[0].date + "']").classList.remove("invisible");
            document.querySelector(".addBox[data-date='" + selection[0].date + "']").disabled = false;
          }
        };

        [].slice.call(document.querySelectorAll(".addBox")).forEach(($el) => {
          $el.onclick = (e) => {
            e.preventDefault();
            var onSuccess = () => {
              var date = selection[0].date;
              [cache.logs.data.lastWeekLog, cache.logs.data.thisWeekLog].forEach((z) => z.forEach((log) => {
                if (log.date == date) log.log = log.log[0] == 1 ? [1, 1] : [1, 0];
              }));
              saveCache();
            };
            uploadBlock.startUploadBlock(selection, dateIndexedLogs, onSuccess);
          }
        });


        [].slice.call(document.querySelectorAll(".selectorBox[data-activitydata]")).forEach(($button) => {
          var selected = false;
          var data = JSON.parse($button.getAttribute("data-activitydata"));
          $button.onclick = (e) => {
            e.preventDefault();

            if (!selected) {
              // console.log(selection, dateIndexedLogs);
              var success = false;

              if (selection.length == 0) {
                selection.push(data);
                success = true;
              } else {
                if (selection[0].date == data.date && selection[0].activity.type == data.activity.type) {
                  selection.push(data);
                  success = true;
                }
              }

              // console.log(success);

              if (success) {
                selected = true;
                resolveAddBox();
                $button.classList.remove("btn-outline-primary");
                $button.classList.add("btn-outline-success");
                $button.innerText = "Selected";
              } else {
                $button.classList.remove("btn-outline-primary");
                $button.classList.add("btn-outline-danger");
                $button.innerText = "Cannot Select";
                setTimeout(() => {
                  $button.classList.add("btn-outline-primary");
                  $button.classList.remove("btn-outline-danger");
                  $button.innerText = "Select";
                }, 500);
              }
            } else {
              selected = false;
              $button.classList.add("btn-outline-primary");
              $button.classList.remove("btn-outline-success");
              $button.innerText = "Select";
              var index = -1;
              selection.forEach((selectionData, selectionIndex) => {
                if (selectionData == data) {
                  index = selectionIndex;
                }
              });
              if (index == -1) return;
              selection.splice(index, 1);
              resolveAddBox();
            }
          }
        });
      });
    }
  };
})();

var uploadBlock = (() => {
  //BLOCK — Upload
  return {
    startUploadBlock: (selection, dateIndexedLogs, onSuccess) => {
      var $uploadForm = document.querySelector("#xu-uploadForm"),
        $uploadContainer = document.querySelector("#xu-uploadInterface"),
        $main = document.querySelector("#xu-cl-main"),
        $formControls = {
          $cancelButton: "xu-cancelUploadButton",
          $error: "xu-upload-error",
          $title: "xu-upload-title",
          $distance: "xu-upload-distance",
          $time: "xu-upload-time",
          $description: "xu-upload-description",
          $effortGroup: "xu-upload-effortGroup",
          $feelGroup: "xu-upload-feelGroup",
          $submitButton: "xu-upload-submitButton",
          $success: "xu-upload-success"
        };

      var packUp = () => {
        // console.log("packing up");
        $formControls.$submitButton.disabled = false;
        $formControls.$success.classList.add("d-none");
        [$formControls.$effortGroup, $formControls.$feelGroup].forEach(($group) => {
          $group.removeAttribute("data-selected");
          [].slice.call($group.children).forEach(($child) => $child.classList.remove("active"));
        });
        $main.classList.remove("d-none");
        mainBlock.startMainBlock();
        $uploadContainer.classList.add("d-none");
      };


      for (var index in $formControls) {
        $formControls[index] = document.getElementById($formControls[index]);
      }


      $formControls.$cancelButton.onclick = packUp;
      // console.log($formControls.$cancelButton, packUp);

      var postToXCStats = firebase.functions().httpsCallable("postToXCStats");
      var date = selection[0].date;
      // console.log(selection, dateIndexedLogs[date]);

      var activityCollection = selection;
      if (!activityCollection || activityCollection.length == 0) return;

      var useElapsedTime = false;

      //All activities should be the same type
      //All activities should already be the same day

      var date = activityCollection[0].date;
      var type = activityCollection[0].activity.type;
      var title = type;

      if (activityCollection.length == 1) {
        title += " - " + activityCollection[0].activity.title;
      } else {
        title += " - " + date;
      }

      console.log(activityCollection);

      var description = activityCollection.map((activity, i) => "Map" +
        (activityCollection.length > 1 ? "" + (i + 1) : "") +
        ": https://strava.com/activities/" +
        activity.activity.id +
        (activity.activity.avgHR && activity.activity.avgHR != -1 ? "\n\nAverage Heart Rate: " + activity.activity.avgHR + "bpm" : "")).join("\n -- \n");

      var totalLength = activityCollection.reduce((accumulator, activity) => accumulator + activity.activity.distance, 0);
      var totalTime = activityCollection.reduce((accumulator, activity) => accumulator + activity.activity[useElapsedTime ? "elapsedTime" : "movingTime"], 0);

      var totalMins = Math.floor(totalTime / 60);
      var totalSec = Math.floor(totalTime % 60);

      $formControls.$title.value = title;
      $formControls.$distance.innerText = totalLength.toFixed(1) + "mi";
      $formControls.$time.innerText = totalMins + ":" + (totalSec + "").padStart(2, "0");
      $formControls.$description.value = description;

      $main.classList.add("d-none");
      $uploadContainer.classList.remove("d-none");

      [$formControls.$effortGroup, $formControls.$feelGroup].forEach(function($group) {

        var $children = [].slice.call($group.children);
        // console.log($children);
        $children.forEach(($child, childIndex) => {
          $child.onclick = () => {
            $children.forEach(($otherChild) => $otherChild.classList.remove("active"));
            $child.classList.add("active");
            $group.setAttribute("data-selected", childIndex);
          }
        });

      });

      var error = (text) => {
        $formControls.$error.classList.remove("d-none");
        $formControls.$error.innerText = "Could not submit because " + text;
        $formControls.$submitButton.disabled = false;
      };

      $uploadForm.onsubmit = (e) => {
        e.preventDefault();
        $formControls.$error.classList.add("d-none");
        $formControls.$submitButton.disabled = true;

        if ($formControls.$title.value == "") {
          return error("the title is blank.");
        } else if (!$formControls.$effortGroup.hasAttribute("data-selected")) {
          return error("there is no effort level selected.");
        } else if (!$formControls.$feelGroup.hasAttribute("data-selected")) {
          return error("there is no runner feel selected.");
        }

        var payload = {
          recordIndex: dateIndexedLogs[date],
          title: $formControls.$title.value,
          date: date,
          minutes: totalMins,
          seconds: totalSec,
          distance: totalLength.toFixed(1),
          effort: parseInt($formControls.$effortGroup.getAttribute("data-selected")) + 1,
          runnerFeel: parseInt($formControls.$feelGroup.getAttribute("data-selected")) + 1,
          description: $formControls.$description.value
        };

        // console.log(JSON.stringify(payload));
        postToXCStats({
          payload: payload
        }).then((message) => {
          // console.log(message);
          if (message.data.includes("success:::")) {
            $formControls.$success.classList.remove("d-none");
            onSuccess();
            setTimeout(() => packUp(), 1000);
          }
        }).catch((e) => error(e));
      }

      // console.log(totalLength.toFixed(1), totalTime, totalMins, totalSec);

    }
  };
})();

(() => {
  //BLOCK — Settings

  var $settingsButton = document.getElementById("xu-settingsButton"),
    $settingsBlock = document.getElementById("xu-settingsBlock"),
    $closeSettingsButton = document.getElementById("xu-s-closeSettingsButton"),
    $deleteDataButton = document.getElementById("xu-s-deleteDataButton"),
    $deleteAccountButton = document.getElementById("xu-s-deleteAccountButton"),
    $deletionError = document.getElementById("xu-s-deletionError");
  $otherBlocks = ["xu-uploadInterface", "xu-cl-main", "xu-cl-loginFlow", "xu-settingsButton", "xu-s-spacer"].map((id) => document.getElementById(id));

  $settingsButton.onclick = () => {
    // console.log($otherBlocks);
    $otherBlocks.forEach(($block) => $block.classList.add("d-none"));
    $settingsBlock.classList.remove("d-none");
  };

  $closeSettingsButton.onclick = () => location.reload();

  var deleteData = (deleteAccount = false) => {
      return new Promise(function(resolve, reject) {
        var uid = firebase.auth().currentUser.uid;
        if (!uid) return;

        if (confirm("Are you sure you would like to delete your " + (deleteAccount ? "account" : "data") + "?")) {
          firebase.firestore().doc("users/" + uid).delete().then(resolve).catch((error) => reject({
            status: false,
            error: error
          }));
        } else {
          reject({
            status: false,
            error: {
              message: "User did not confirm."
            }
          });
        }
      });
    },
    deleteAccount = () => {
      return new Promise(function(resolve, reject) {
        deleteData(true).then(() => {
          var provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider).then(() => {
            firebase.auth().currentUser.delete().then(() => {
              resolve();
            }).catch((error) => {
              reject({
                status: false,
                error: error
              });
            });
          }).catch(reject);
        }).catch(reject);
      });
    };
  $deleteDataButton.onclick = () => {
    [$deleteDataButton, $deleteAccountButton].forEach(($btn) => $btn.disabled = true);
    deleteData().then(() => {
      $deletionError.innerText = "Deletion succeeded. Reloading...";
      $deletionError.classList.remove("d-none");
      setTimeout(() => location.assign(location.href.split("?")[0]), 1000);
    }).catch((error) => {
      $deletionError.innerText = error;
      $deletionError.classList.remove("d-none");
      [$deleteDataButton, $deleteAccountButton].forEach(($btn) => $btn.disabled = false);
    });
  };
  $deleteAccountButton.onclick = () => {
    [$deleteDataButton, $deleteAccountButton].forEach(($btn) => $btn.disabled = true);
    deleteAccount().then(() => {
      $deletionError.innerText = "Deletion succeeded. Goodbye.";
      $deletionError.classList.remove("d-none");
      setTimeout(() => location.assign(".."), 1000);
    }).catch((error) => {
      // console.log(error);
      $deletionError.innerText = error.error.message;
      $deletionError.classList.remove("d-none");
      [$deleteDataButton, $deleteAccountButton].forEach(($btn) => $btn.disabled = false);
    });
  };
})();
