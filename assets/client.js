(() => {
  //Block - XCStats login
  var loginToXCStats = firebase.functions().httpsCallable('loginToXCStats');

  var $xcStatsLoginButton = document.querySelector("#xu-cl-xcstats-loginButton"),
    $xcStatsLoginForm = document.querySelector("#xu-cl-xcstats-loginForm"),
    $emailInput = document.querySelector("#xu-cl-xcstats-email"),
    $passwordInput = document.querySelector("#xu-cl-xcstats-password"),
    $submitButton = document.querySelector("#xu-cl-xcstats-submitButton"),
    $errorAlert = document.querySelector("#xu-cl-xcstats-loginError"),
    $stravaLoginbutton = document.querySelector("#xu-cl-strava-loginButton");

  $xcStatsLoginButton.onclick = () => {
    $xcStatsLoginButton.disabled = true;
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
      console.log(response);
      $xcStatsLoginForm.classList.add("d-none");
      $stravaLoginbutton.disabled = false;
    }).catch((error) => {
      console.error(error);
      $errorAlert.innerText = "Login error";
      $errorAlert.classList.remove("d-none");
      $submitButton.disabled = false;
    });

  }
})();

(() => {
  //BLOCK — Strava Log in
  var getStravaLoginURL = firebase.functions().httpsCallable("getStravaLoginURL");

  var $stravaLoginbutton = document.querySelector("#xu-cl-strava-loginButton");

  $stravaLoginbutton.onclick = () => {
    $stravaLoginbutton.disabled = true;
    firebase.auth().currentUser.getIdToken(true).then((token) => {
      getStravaLoginURL({
        token: token
      }).then((url) => {
        console.log(url);
        location.assign(url.data);
      }).catch((loginURLError) => {
        console.error(loginURLError);
      });
    }).catch((idTokenError) => {
      console.error(idTokenError);
    })
  };

})();

(() => {
  //BLOCK — Login Flow

  var $xcStatsLoginButton = document.querySelector("#xu-cl-xcstats-loginButton"),
    $stravaLoginbutton = document.querySelector("#xu-cl-strava-loginButton");


  firebase.auth().onAuthStateChanged(() => {

    if (!firebase.auth().currentUser) location.assign("..");

    var $loginFlow = document.querySelector("#xu-cl-loginFlow"),
      $main = document.querySelector("#xu-cl-main");

    firebase.firestore().doc("users/" + firebase.auth().currentUser.uid).get().then((userDataSnapshot) => {
      var userData = userDataSnapshot.data();
      console.log(userData);

      if (userData && (userData["markers.hasLoggedInWithXCStats"] &&
          userData["markers.hasLoggedInWithXCStats"].status == true &&
          userData["markers.hasLoggedInWithStrava"] &&
          userData["markers.hasLoggedInWithStrava"].status == true) ||
        location.search.includes("stravaAuthSucceeded")) {
        $xcStatsLoginButton.disabled = true;
        $stravaLoginbutton.disabled = true;
        $main.classList.remove("d-none");
        mainBlock.startMainBlock();
      } else if (userData && userData["markers.hasLoggedInWithXCStats"] && userData["markers.hasLoggedInWithXCStats"].status == true) {
        $xcStatsLoginButton.disabled = true;
        $stravaLoginbutton.disabled = false;
        $loginFlow.classList.remove("d-none");
      } else {
        $loginFlow.classList.remove("d-none");
      }
    }).catch((error) => console.error(error));


  });

})();

var mainBlock = (() => {
  //BLOCK — main

  var createElementFromHTML = function(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
  }

  return {
    startMainBlock: () => {
      var downloadStravaActivities = firebase.functions().httpsCallable("downloadStravaActivities");
      var getTwoWeeksOfLogs = firebase.functions().httpsCallable("getTwoWeeksOfLogs");

      var $downloadingHeader = document.querySelector("#xu-cl-stravaDownloadingHeader"),
        $activitiesList = document.querySelector("#xu-cl-stravaActivitiesList"),
        $activitiesSummary = document.querySelector("#xu-cl-activitiesSummary");

      $downloadingHeader.classList.remove("d-none");
      $activitiesSummary.classList.add("d-none");
      var dayTemplate = document.querySelector("#template-day").innerHTML,
        activityTemplate = document.querySelector("#template-activity").innerHTML;
      getTwoWeeksOfLogs({
        date: new Date()
      }).then((logData) => {
        logData = logData.data;
        console.log(logData);
        var $cells = [].slice.call(document.querySelectorAll(".xu-logDisplay .xu-logDisplay-contentRow .col:not([class*=xu-hh])"));
        for (var i = 0; i < 7; i++) {
          var $lastWeekCell = $cells[i + 7];
          var $thisWeekCell = $cells[i];
          console.log(logData.lastWeekLog[i].log);
          console.log($lastWeekCell, $thisWeekCell);
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
          console.log(log);
          dateIndexedLogs[log.date] = log.log.reduce((acc, el) => acc + el, 0);
        });
        console.log(dateIndexedLogs);

        downloadStravaActivities().then((stravaData) => {
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
                    " miles ; moving time: " +
                    Math.floor(activity.movingTime / 60) + " minutes and " +
                    (activity.movingTime % 60 + "").padStart(2, "0") + " seconds")
                  .replace(/%type%/g, activity.type)
                  .replace(/%url%/g, "https://strava.com/activities/" + activity.id).replace(/%disabled%/g, dateIndexedLogs[date] == 2 ? "disabled" : ""));

                console.log($el);
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
                $el.classList.add("invisible")
              });
            } else {
              document.querySelector(".addBox[data-date='" + selection[0].date + "']").classList.remove("invisible");
              document.querySelector(".addBox[data-date='" + selection[0].date + "']").disabled = false;
            }
          };

          [].slice.call(document.querySelectorAll(".addBox")).forEach(($el) => {
            $el.onclick = (e) => {
              e.preventDefault();
              uploadBlock.startUploadBlock(selection, dateIndexedLogs);
            }
          });


          [].slice.call(document.querySelectorAll(".selectorBox[data-activitydata]")).forEach(($button) => {
            var selected = false;
            var data = JSON.parse($button.getAttribute("data-activitydata"));
            $button.onclick = (e) => {
              e.preventDefault();

              if (!selected) {
                console.log(selection, dateIndexedLogs);
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

                console.log(success);

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
        }).catch((stravaError) => console.error(stravaError));
      }).catch((logError) => console.error(logError));
    }
  };
})();

var uploadBlock = (() => {
  //BLOCK — Upload
  return {
    startUploadBlock: (selection, dateIndexedLogs) => {
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
        console.log("packing up");
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
      console.log($formControls.$cancelButton, packUp);

      var postToXCStats = firebase.functions().httpsCallable("postToXCStats");
      var date = selection[0].date;
      console.log(selection, dateIndexedLogs[date]);

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

      var description = activityCollection.map((activity) => "https://strava.com/activities/" + activity.activity.id + "\n\n");

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
        console.log($children);
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

        console.log(JSON.stringify(payload));
        postToXCStats({
          payload: payload
        }).then((message) => {
          console.log(message);
          if (message.data.includes("success:::")) {
            $formControls.$success.classList.remove("d-none");
            setTimeout(() => packUp(), 1000);
          }
        }).catch((e) => error(e));
      }

      console.log(totalLength.toFixed(1), totalTime, totalMins, totalSec);

    }
  };
})();