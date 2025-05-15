// E:\intern\client\rabit-mq\index.ts
import rabbit from "rabbitmq-stream-js-client";
export const client = await rabbit.connect({
  vhost: "/",
  port: 5552,
  hostname: "localhost",
  username: "guest",
  password: "guest",
});
