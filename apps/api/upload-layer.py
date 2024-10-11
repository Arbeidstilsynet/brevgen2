"""
Download a Chromium layer for AWS Lambda and upload it to S3.
Run before deploying infrastructure that expects the layer content to be in S3.

Usage:
py upload-layer.py --bucket-name {bucket-name} --chromium-version {chromium-version} [--profile {profile-name}] [--skip-confirmation]
py upload-layer.py --bucket-name {env}-felles-brevgenerator2-lambda-layers --chromium-version 127.0.0
"""

import argparse
import os

import boto3
import boto3.s3
import requests
from botocore.exceptions import ClientError


def create_bucket(bucket_name: str) -> None:
    s3_client = boto3.client("s3")
    region = boto3.session.Session().region_name

    s3_client.create_bucket(
        Bucket=bucket_name,
        CreateBucketConfiguration={"LocationConstraint": region},  # type: ignore
        ACL="private",
    )
    s3_client.put_bucket_encryption(
        Bucket=bucket_name,
        ServerSideEncryptionConfiguration={
            "Rules": [
                {"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
            ]
        },
    )
    s3_client.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )


def check_file_exists_in_bucket(bucket_name: str, s3_key: str) -> bool:
    """Check if a file exists in the specified S3 bucket."""
    s3_client = boto3.client("s3")
    try:
        s3_client.head_object(Bucket=bucket_name, Key=s3_key)
        print(f"File {s3_key} exists in bucket {bucket_name}")
        return True
    except ClientError as err:
        if err.response["Error"]["Code"] == "404":
            print(f"File {s3_key} does not exist in bucket {bucket_name}")
            return False
        else:
            raise


def create_bucket_if_not_exists(bucket_name: str, s3_key: str) -> bool:
    """Create the S3 bucket if it doesn't exist."""
    s3_client = boto3.client("s3")
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"Bucket {bucket_name} already exists")
        return check_file_exists_in_bucket(bucket_name=bucket_name, s3_key=s3_key)
    except ClientError as err:
        if "Not Found" not in str(err):
            raise err
        print(f"Bucket not found, creating bucket {bucket_name}...")
        create_bucket(bucket_name)
        print(f"Bucket {bucket_name} created")
        return False


def get_account_info() -> dict:
    """Get AWS account information."""
    sts_client = boto3.client("sts")
    return sts_client.get_caller_identity()


def confirm_action(
    account_info: dict,
    bucket_name: str,
    s3_key: str,
    chromium_url: str,
) -> bool:
    """Ask for user confirmation to continue."""
    print(f"Account: {account_info['Account']}")
    print(f"Role: {account_info['Arn'].split(':')[-1]}")
    print(f"Bucket/Key: {bucket_name}")
    print(f"S3 Key: {s3_key}")
    print(f"Chromium: {chromium_url}")
    return input("Do you want to continue? (y/n): ").strip().lower() == "y"


def download_chromium_layer(chromium_url: str, layer_file: str) -> None:
    """Download the Chromium layer from the specified URL."""
    print(f"Downloading Chromium layer from {chromium_url}...")
    response = requests.get(chromium_url)

    if len(response.content) < 10 * 1024 * 1024:
        raise ValueError(
            f"Download failed: The response size is only {len(response.content)} bytes."
            + f" Incorrect URL? Check chromium version. {chromium_url=}"
        )

    with open(layer_file, "wb") as file:
        file.write(response.content)
    print("Download complete")


def upload_to_s3(bucket_name: str, layer_file: str, s3_key: str) -> None:
    """Upload the layer file to the specified S3 bucket."""
    print(f"Uploading {layer_file} to S3 bucket {bucket_name}...")
    s3_client = boto3.client("s3")
    s3_client.upload_file(layer_file, bucket_name, s3_key)
    print("Upload complete")


def clean_up(layer_file: str) -> None:
    """Remove the downloaded layer file."""
    os.remove(layer_file)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Upload and publish Chromium layer to AWS Lambda."
    )
    parser.add_argument(
        "--bucket-name",
        type=str,
        required=True,
        help="S3 bucket name",
    )
    parser.add_argument(
        "--chromium-version", type=str, required=True, help="Chromium version"
    )
    parser.add_argument(
        "--profile",
        type=str,
        help="AWS CLI profile name. Uses environment credentials if not provided.",
    )
    parser.add_argument(
        "--skip-confirmation", action="store_true", help="Skip the confirmation step"
    )
    args = parser.parse_args()

    if args.profile:
        boto3.setup_default_session(profile_name=args.profile)

    bucket_name = args.bucket_name
    chromium_version = args.chromium_version
    layer_file = f"chromium-v{chromium_version}-layer.zip"
    s3_key = f"chromiumLayers/{layer_file}"
    chromium_url = f"https://github.com/Sparticuz/chromium/releases/download/v{chromium_version}/{layer_file}"

    print(f"{s3_key=} {chromium_url=}")

    if not args.skip_confirmation:
        account_info = get_account_info()
        if not confirm_action(
            account_info=account_info,
            bucket_name=bucket_name,
            s3_key=s3_key,
            chromium_url=chromium_url,
        ):
            return

    file_already_in_bucket = create_bucket_if_not_exists(bucket_name, s3_key)
    if file_already_in_bucket:
        return
    download_chromium_layer(chromium_url=chromium_url, layer_file=layer_file)
    upload_to_s3(bucket_name=bucket_name, layer_file=layer_file, s3_key=s3_key)
    clean_up(layer_file=layer_file)


if __name__ == "__main__":
    main()
