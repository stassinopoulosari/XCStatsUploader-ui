var productionSources = {
  home: ["assets/login.min.js"],
  client: ["../assets/client.min.js"]
};
var developmentSources = {
  home: ["assets/login.js"],
  client: ["../assets/client.js"]
};
var sources;
if(location.hostname == "localhost") {
  sources = developmentSources;
} else {
  sources = productionSources;
}
if(location.pathname.includes("client")) {
  sources = sources.client;
} else {
  sources = sources.home;
}
console.log(sources);
fetchInject(sources);
