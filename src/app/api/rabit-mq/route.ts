// E:\intern\src\app\api\rabbitmq-producer\route.ts

import { NextRequest, NextResponse } from "next/server";
import amqplib from "amqplib";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  console.log("hitting");
  const authHeader = req.headers.get("authorization");
  let email = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.decode(token) as { email?: string };
      email = decoded?.email || "";
    } catch (err) {
      console.error("Token decode error", err);
    }
  }

  const formData = await req.formData();
  const files = formData.getAll("file") as File[];
  const fileNames = formData.getAll("fileName") as string[];
  const bucket = formData.get("bucket");
  const path = formData.get("path");

  const buffers = await Promise.all(
    files.map(async (file) =>
      Buffer.from(await file.arrayBuffer()).toString("base64")
    )
  );

  const message = {
    files: buffers,
    fileNames,
    bucket,
    path,
    email,
  };

  try {
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();
    const queue = "upload-files";

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    await channel.close();
    await connection.close();

    return NextResponse.json(
      { status: "file sent to RabbitMQ" },
      { status: 200 }
    );
  } catch (error) {
    console.error("RabbitMQ error:", error);
    return NextResponse.json({ error: "Failed to send file" }, { status: 500 });
  }
}
