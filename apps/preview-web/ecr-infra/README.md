# Infra (ECR)

## samconfig.toml

Erstatt {env} med ditt navn

```toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "brevgenerator2-web-ecr-{env}"
s3_prefix = "brevgenerator2-web-ecr-{env}"
s3_bucket = "infra-dev-deploy-pub-bucket"
region = "eu-west-1"
confirm_changeset = false
capabilities = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]
parameter_overrides = [
    'EcrRepositoryName=""', # script will override this parameter
]
```
