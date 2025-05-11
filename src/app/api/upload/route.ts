import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import {
  s3ClientPathStyle,
  s3ClientVirtualHost,
} from "../../../../util/s3client";

const upload = multer({ storage: multer.memoryStorage() });

// const runMiddleware = (
//   req: NextRequest,
//   res: NextResponse,
//   fn: (
//     req: NextRequest,
//     res: NextResponse,
//     next: (err?: unknown) => void
//   ) => void
// ) => {
//   return new Promise((resolve, reject) => {
//     fn(req, res, (result: unknown) => {
//       if (result instanceof Error) {
//         return reject(result);
//       }
//       return resolve(result);
//     });
//   });
// };

async function uploadToZata(
  client: S3Client,
  file: Express.Multer.File,
  bucket: string
) {
  console.log("path:", bucket);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await client.send(command);
  } catch (err) {
    console.log(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const bucket = process.env.ZATA_BUCKET!;
    const formData = await req.formData();
    console.log(formData.get("file"));
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const multerFile: Express.Multer.File = {
      originalname: file.name,
      mimetype: file.type,
      buffer,
      size: file.size,
      fieldname: "file",
      encoding: "7bit",
      destination: "",
      filename: file.name,
      path: "",
      stream: null as any,
    };

    // Upload using Path-Style
    try {
      console.log("--->endpouint", process.env.ZATA_ENDPOINT);
      const result = await uploadToZata(s3ClientPathStyle, multerFile, bucket);
      console.log("---->", result);
    } catch (err) {
      console.log(err);
    }
    console.log(`Uploaded ${file.name} using path-style`);

    // // Upload using Virtual Host-Style (if supported by Zata.ai)
    // try {
    //   await uploadToZata(s3ClientVirtualHost, multerFile, bucket);
    //   console.log(`Uploaded ${file.name} using virtual host-style`);
    // } catch (error) {
    //   console.error("Virtual host-style upload failed:", error);
    // }

    return NextResponse.json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
