const readline = require("readline");
const sodium = require("libsodium-wrappers");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const owner = "PhilipWee";
const repo = "better-zustand-store";

function getGithubToken() {
  return new Promise((resolve) => {
    rl.question(
      "Please enter your GitHub token (If you dont have one, find instructions in updateGithubEnv.js): ",
      (token) => {
        resolve(token.trim());
      }
    );
  });
}

async function updateGithubSecret(
  octokit,
  secretName,
  secretValue,
  environment
) {
  try {
    // Get the public key for the repository
    const { data: publicKey } = await (environment
      ? octokit.rest.actions.getEnvironmentPublicKey({
          owner,
          repo,
          environment_name: environment,
        })
      : octokit.rest.actions.getRepoPublicKey({
          owner,
          repo,
        }));

    if (secretValue === undefined) {
      throw new Error("Secret value is undefined!");
    }

    // Convert the secret value to a string if it's not already
    const secretString =
      typeof secretValue === "string"
        ? secretValue
        : JSON.stringify(secretValue);

    // Encrypt the secret using the public key
    await sodium.ready;
    const binKey = sodium.from_base64(
      publicKey.key,
      sodium.base64_variants.ORIGINAL
    );
    const binSecret = sodium.from_string(secretString);
    const encBytes = sodium.crypto_box_seal(binSecret, binKey);
    const encryptedValue = sodium.to_base64(
      encBytes,
      sodium.base64_variants.ORIGINAL
    );

    // Update the secret
    if (environment) {
      const res = await octokit.rest.actions.createOrUpdateEnvironmentSecret({
        owner,
        repo,
        environment_name: environment,
        secret_name: secretName,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });
    } else {
      const res = await octokit.rest.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name: secretName,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });
    }

    console.log(
      `Successfully updated secret ${secretName} for environment ${environment}`
    );
  } catch (error) {
    console.error(
      `Error updating secret ${secretName} for environment ${environment}:`,
      error
    );
  }
}

async function main() {
  const token = await getGithubToken();

  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });

  // Read from .env file
  const dotenv = await import('dotenv');
  dotenv.config();

  const additionalKeys = ["NPM_TOKEN", "GH_ACCESS_TOKEN"];
  for (const additionalKey of additionalKeys) {
    await updateGithubSecret(
      octokit,
      additionalKey,
      process.env[additionalKey]
    );
  }

  rl.close();
}

main().catch(console.error);

/**
 * To get a github token, go to your account, scroll to the bottom for developer settings,
 * then personal access tokens, then fine grained access tokens, select the repository owner to kapydev
 * then make sure to give the secrets read/write permission to the key being created
 *
 * If you are philip, you can find the key in your usual storage space
 */
