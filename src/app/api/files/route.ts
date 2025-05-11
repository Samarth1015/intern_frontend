import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3ClientPathStyle } from "../../../../util/s3client";

interface FileInfo {
  key: string;
  pathStyleUrl: string;
  virtualHostUrl?: string;
}

async function getPresignedUrl(client: S3Client, bucket: string, key: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function GET() {
  try {
    const bucket = process.env.ZATA_BUCKET!;

    const command = new ListObjectsV2Command({ Bucket: bucket });
    const pathStyleResponse = await s3ClientPathStyle.send(command);
    // console.log("getting object----->", pathStyleResponse);

    const files: FileInfo[] = [];

    if (pathStyleResponse.Contents) {
      for (const item of pathStyleResponse.Contents) {
        if (item.Key) {
          const pathStyleUrl = await getPresignedUrl(
            s3ClientPathStyle,
            bucket,
            item.Key
          );

          let virtualHostUrl: string | undefined;
          //   try {
          //     virtualHostUrl = await getPresignedUrl(
          //       s3ClientVirtualHost,
          //       bucket,
          //       item.Key
          //     );
          //   } catch (error) {
          //     console.error(
          //       `Virtual host-style URL generation failed for ${item.Key}:`,
          //       error
          //     );
          //   }

          files.push({
            key: item.Key,
            pathStyleUrl,
            virtualHostUrl,
          });
        }
      }
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
