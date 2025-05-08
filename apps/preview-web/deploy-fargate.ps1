param (
    [Parameter(mandatory = $true)]
    [string] $envName,
    [string] $region = "eu-west-1",
    [bool] $confirmRun = $true,
    [bool] $buildContainer = $true,
    [string] $domainName,
    [string] $CrossAccountRoute53RoleArn = "arn:aws:iam::250640723606:role/felles-cfn-extensions-prod-crossaccount-r53-role",
    [string] $DomainHostedZoneId = "Z073533223SF44MXB039V"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version 3.0

if (!$domainName) {
    $domainName = "brevgenerator-$envName.arbeidstilsynet.no"
}


$envFilePath = ".env"

if (Test-Path $envFilePath) {
    Get-Content $envFilePath | ForEach-Object {
        # Skip empty lines and comments
        if ($_ -and $_ -notmatch '^#') {
            # Split line into key and value
            $key, $value = $_ -split '=', 2

            Set-Variable -Name $key.Trim() -Value $value.Trim()
        }
    }
}
else {
    Write-Host "The .env file was not found at $envFilePath"
    exit 1
}

if (-not ($PDF_API_URL -and $PDF_API_KEY -and $AZURE_DEVOPS_PAT)) {
    Write-Host "Error: One or more required environment variables are missing."
    exit 1
}


$awsAccount = aws sts get-caller-identity --query Account --output text
$awsAccountAlias = aws iam list-account-aliases --query 'AccountAliases[0]' --output text

if ($confirmRun) {
    $confirmationResponse = Read-Host -Prompt "AWS account: $awsAccount ($awsAccountAlias), PDF_API_URL=$PDF_API_URL, continue? y/n"
    if ($confirmationResponse.ToLower() -ne 'y') {
        exit
    }
}

$imageName = "$envName-brevgen2-web"
$ecrUrl = "$awsAccount.dkr.ecr.$region.amazonaws.com"

if ($buildContainer) {
    # ensure docker is running before changing directories
    docker info > $null

    Write-Host Building container...
    Set-Location ../..
    docker build . -t $imageName -f apps/preview-web/Dockerfile
    Set-Location -
}
else {
    Write-Host Skipping building container
}

Set-Location ecr-infra
Write-Host "`nDeploying ECR..."
sam build
sam deploy --no-fail-on-empty-changeset --parameter-overrides "EcrRepositoryName=$imageName"
Set-Location -

if ($buildContainer) {
    Write-Host "`nTagging and uploading container..."
    aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$ecrUrl"
    docker tag "${imageName}:latest" "${ecrUrl}/${imageName}:latest"
    docker push "${ecrUrl}/${imageName}:latest"
}

# hent image digest for at ECS skal oppdage endring vs. å bruke :latest tag
$imageDigest = aws ecr describe-images --repository-name "$imageName" --image-ids imageTag=latest --query "imageDetails[0].imageDigest" --output text
$imageUri = "${ecrUrl}/${imageName}@${imageDigest}"

Write-Host "`nImageURI: $imageUri`n"

Write-Host "`nDeploying Fargate..."
Set-Location infra
sam build
sam deploy --no-fail-on-empty-changeset --parameter-overrides "Env=$envName ImageURI=$imageUri DomainName=$domainName CrossAccountRoute53RoleArn=$CrossAccountRoute53RoleArn DomainHostedZoneId=$DomainHostedZoneId PdfApiUrl=$PDF_API_URL PdfApiKey=$PDF_API_KEY AzureDevopsPat=$AZURE_DEVOPS_PAT"
Set-Location -
