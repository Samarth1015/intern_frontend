// E:\intern\src\app\api\kafka-producer\route.ts
import { NextRequest, NextResponse } from "next/server";
import { kafka } from "../../../../client/kafka";
import jwt from "jsonwebtoken";
const producer = kafka.producer();

export async function POST(req: NextRequest) {
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
  const file = formData.getAll("file") as File[];
  //   console.log(file);
  const fileNames = formData.getAll("fileName") as string[];
  console.log("fileee", file);
  const bucket = formData.get("bucket");
  const name = formData.get("path");
  console.log("namee==>", name);

  // const buffer = Buffer.from(await file.arrayBuffer());
  const buffer = await Promise.all(
    file.map(async (f) => Buffer.from(await f.arrayBuffer()))
  );
  console.log(buffer);
  await producer.connect();

  await producer.send({
    topic: "upload-files",
    messages: [
      {
        value: JSON.stringify({
          file: buffer.map((b) => b.toString("base64")),
          name: name,
          bucket,
          fileNames,
          email: email,
        }),
      },
    ],
  });
  await producer.disconnect();

  return NextResponse.json({ status: "file sent to Kafka" }, { status: 200 });
}
