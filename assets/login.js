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

})();

// loginToStrava = firebase.functions().httpsCallable("loginToStrava");
