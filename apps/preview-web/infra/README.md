# Infra (Fargate)

## samconfig.toml

Erstatt {env} med ditt navn

```toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "{env}-brevgen2-web-fargate"
s3_prefix = "{env}-brevgen2-web-fargate"
s3_bucket = "infra-dev-deploy-bucket"
region = "eu-west-1"
confirm_changeset = false
capabilities = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]
parameter_overrides = [
    # Trenger ikke sette noen parametre for å deploye via script, alle blir overstyrt

    'Env="{env}"',
    'ImageURI="106179378219.dkr.ecr.eu-west-1.amazonaws.com/{env}-brevgen2-web:latest"',
    'DomainName="brevgenerator-{env}.arbeidstilsynet.no"',

    'CrossAccountRoute53RoleArn="arn:aws:iam::250640723606:role/felles-cfn-extensions-prod-crossaccount-r53-role"',
    'DomainHostedZoneId="Z073533223SF44MXB039V"',                                                                   # arbeidstilsynet.no i AWS-kontoen SharedServices
]
```
