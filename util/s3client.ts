import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.ZATA_ENDPOINT;
// const accessKeyId = process.env.ZATA_ACCESS_KEY_ID;
// const secretAccessKey = process.env.ZATA_SECRET_ACCESS_KEY;
const region = process.env.ZATA_REGION || "us-east-1";

export const s3ClientPathStyle = (
  accessKeyId: string,
  secretAccessKey: string
): S3Client => {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Accesskey id is missing");
  }
  return new S3Client({
    endpoint: `https://${endpoint}`,
    region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: true,
  });
};
// export const s3ClientPathStyle = new S3Client({
//   endpoint: `https://${endpoint}`,
//   region,
//   credentials: {
//     accessKeyId: accessKeyId!,
//     secretAccessKey: secretAccessKey!,
//   },
//   forcePathStyle: true,
// });

// export const s3ClientVirtualHost = new S3Client({
//   endpoint: `https://${endpoint}`,
//   region,
//   credentials: {
//     accessKeyId: accessKeyId!,
//     secretAccessKey: secretAccessKey!,
//   },
//   forcePathStyle: false,
// });
