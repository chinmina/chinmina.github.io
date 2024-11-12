---
title: Using KMS to protect GitHub App keys
description: Keep your GitHub app private key safe from compromise via AWS KMS.
---

Github Apps make authenticated API calls by generating a JWT from a private key
issued for the app. This private key is an extremely sensitive credential, as it
can be used to access the full scope of actions assigned to the GitHub App.

Chinmina Bridge supports signing JWTs using AWS KMS, ensuring that key material
cannot be extracted from the executing process or from the account
configuration.

:::caution

It is more complicated to use KMS compared to a simple environment variable.
Given the power of this credential however, it is **strongly** recommended that
any production implementation of Chinmina (running on AWS) uses this strategy.

:::

## Uploading the private key to AWS KMS

1. [Generate the private key][github-key-generate] for the GitHub application.

2. Check the private key and convert it ready for upload
    - the key spec for your GitHub key _should_ be RSA 2048. To verify that this is
      the case, run `openssl rsa -text -noout -in yourkey.pem` and examine the
      output.
    - convert the GitHub key from PEM to DER format for AWS:

        ```shell
        openssl rsa -inform PEM -outform DER -in ./private-key.pem -out private-key.cer
        ```

3. Follow the [AWS instructions][aws-import-key-material] for importing the
   application private key into GitHub. This includes creating an RSA 2048 key
   of type "EXTERNAL", encrypting the key material according to the instructions
   and uploading it.

4. Create an alias for the KMS key to allow for easy [manual key
   rotation][aws-manual-key-rotation].

    :::tip[Important]

    A key alias is essential to allow for key rotation. Unless you're stopped by
    your organizational policy, use the alias. The private key will be able to be rotated without
    any service downtime.

    :::

5. Ensure that the key policy has a statement allowing Chinmina to access the key. The specified role should be the role that the Chinmina process has access to at runtime.

    ```json
    {
        "Sid": "Allow Chinmina to sign using the key",
        "Effect": "Allow",
        "Principal": {
            "AWS": [
                "arn:aws:iam::226140413739:role/full-task-role-name"
            ]
        },
        "Action": [
            "kms:Sign"
        ],
        "Resource": "*"
    }
    ```

:::tip

Chinmina does not assume a role to access the key: it assumes valid credentials
are present for the AWS SDK to use. Typically these are available to the
container via the credentials supplied via the IMDS (instance metadata service).

:::

## Configuring the Chinmina service

1. Set the environment variable `GITHUB_APP_PRIVATE_KEY_ARN` to the ARN of the **alias** that has just been created.

2. Update IAM for your key
    1. The KMS key resource policy needs to allow the service to use the key
       _for signing only_.
    2. The IAM policy for the Chinmina process (i.e. the AWS role available to
       Chinmina when it runs) needs to be able to use the _alias_ created for
       the private key. This is done with a condition in the policy element:

       ```json
        {
            "Action": "kms:Sign",
            "Effect": "Allow",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "kms:RequestAlias": "alias/chinmina-signing",
                },
            },
        }
        ```

        Using the `kms:RequestAlias` condition instead of the fully qualified
        key ARN in the `resource` attribute allows for transparent key rotation
        without service interruption.

[github-key-generate]: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#generating-private-keys
[aws-import-key-material]: https://docs.aws.amazon.com/kms/latest/developerguide/importing-keys.html
[aws-manual-key-rotation]: https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html#rotate-keys-manually
