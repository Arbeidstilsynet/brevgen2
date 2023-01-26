## Getting started

Lag din egen `samconfig.toml`-fil inne i src/-mappa

```yml
version = 0.1

[default.deploy.parameters]
stack_name = "felles-brevgenerator-{dittnavn}-all-cf"
s3_prefix = "felles-brevgenerator-{dittnavn}-all-cf"
s3_bucket = "infra-sandbox-deploy-bucket"
region = "eu-west-1"
confirm_changeset = "false"
capabilities = [
"CAPABILITY_IAM",
"CAPABILITY_NAMED_IAM"
]
parameter_overrides = [
'env={dittnavn}',
]
```

- Id'en til apiet blir lagret i SSM-parameter: `/felles/${dittnavn}/brevgenerator/api/id` hvis det er ditt eget miljø.
