(() => {
  //Block: login

  var $loginButton = document.querySelector("#xu-loginButton")
  $loginButton.onclick = () => {

    $loginButton.disabled = true;

    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithRedirect(provider);
  };

  firebase.auth().getRedirectResult().then(function(result) {
    if(result.credential) {
      location.assign("./client/");
    }
  });

  firebase.auth().onAuthStateChanged(() => {
    if(firebase.auth().currentUser) location.assign("./client/");
    else $loginButton.disabled = false;
  });


})();

// loginToStrava = firebase.functions().httpsCallable("loginToStrava");
