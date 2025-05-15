// E:\intern\keycloak\client\client.ts
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "internrealm",
  clientId: "nextjs-client",
});

export default keycloak;
