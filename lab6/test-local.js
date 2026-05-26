const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_OUTPUT_FILE = path.join(__dirname, 'temp-output.txt');

/**
 * Runs a single test case by setting up environments, executing index.js,
 * and checking exit code and GITHUB_OUTPUT values.
 */
function runTestCase({
  name,
  branchName,
  allowedPrefixes,
  maxLength,
  failOnInvalid,
  expectedIsValid,
  expectedTag,
  expectedType,
  expectExitCode = 0
}) {
  console.log(`\n========================================`);
  console.log(`Running Test: ${name}`);
  console.log(`========================================`);

  // Clear previous output file
  if (fs.existsSync(TEMP_OUTPUT_FILE)) {
    fs.unlinkSync(TEMP_OUTPUT_FILE);
  }

  // Setup environments mimicking GitHub Action inputs
  const env = {
    ...process.env,
    GITHUB_OUTPUT: TEMP_OUTPUT_FILE,
    INPUT_BRANCH_NAME: branchName,
  };

  if (allowedPrefixes !== undefined) {
    env.INPUT_ALLOWED_PREFIXES = allowedPrefixes;
  } else {
    delete env.INPUT_ALLOWED_PREFIXES;
  }

  if (maxLength !== undefined) {
    env.INPUT_MAX_LENGTH = String(maxLength);
  } else {
    delete env.INPUT_MAX_LENGTH;
  }

  if (failOnInvalid !== undefined) {
    env.INPUT_FAIL_ON_INVALID = String(failOnInvalid);
  } else {
    delete env.INPUT_FAIL_ON_INVALID;
  }

  let exitCode = 0;
  let stdout = '';
  try {
    stdout = execSync('node index.js', { env, encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    exitCode = error.status;
    stdout = error.stdout || '';
    const stderr = error.stderr || '';
    if (stderr) console.error('STDERR:', stderr);
  }

  console.log(stdout);

  // Check exit code
  if (exitCode !== expectExitCode) {
    throw new Error(`Test "${name}" FAILED: expected exit code ${expectExitCode}, but got ${exitCode}`);
  }

  // Parse results from mock GITHUB_OUTPUT
  let outputs = {};
  if (fs.existsSync(TEMP_OUTPUT_FILE)) {
    const fileContent = fs.readFileSync(TEMP_OUTPUT_FILE, 'utf8');
    const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const key = line.substring(0, eqIdx);
        const val = line.substring(eqIdx + 1);
        outputs[key] = val;
      }
    }
  }

  console.log('Parsed Outputs:', outputs);

  // Verify expectations
  if (expectedIsValid !== undefined && outputs['is-valid'] !== String(expectedIsValid)) {
    throw new Error(`Test "${name}" FAILED: expected is-valid to be "${expectedIsValid}", got "${outputs['is-valid']}"`);
  }
  if (expectedTag !== undefined && outputs['normalized-tag'] !== expectedTag) {
    throw new Error(`Test "${name}" FAILED: expected normalized-tag to be "${expectedTag}", got "${outputs['normalized-tag']}"`);
  }
  if (expectedType !== undefined && outputs['branch-type'] !== expectedType) {
    throw new Error(`Test "${name}" FAILED: expected branch-type to be "${expectedType}", got "${outputs['branch-type']}"`);
  }

  console.log(`✓ Test "${name}" PASSED`);
}

/**
 * Main execution of the local test suite
 */
function runAll() {
  try {
    // Case 1: Standard valid feature branch
    runTestCase({
      name: 'Valid Feature Branch',
      branchName: 'feature/login-validation',
      expectedIsValid: true,
      expectedTag: 'feature-login-validation',
      expectedType: 'feature',
      expectExitCode: 0
    });

    // Case 2: Branch name containing GitHub ref path
    runTestCase({
      name: 'Cleanup git refs/heads prefix',
      branchName: 'refs/heads/feature/oauth2-login',
      expectedIsValid: true,
      expectedTag: 'feature-oauth2-login',
      expectedType: 'feature',
      expectExitCode: 0
    });

    // Case 3: Exact match for a release/standard branch
    runTestCase({
      name: 'Exact Match Develop Branch',
      branchName: 'develop',
      expectedIsValid: true,
      expectedTag: 'develop',
      expectedType: 'develop',
      expectExitCode: 0
    });

    // Case 4: Invalid prefix with failOnInvalid = true (should fail process)
    runTestCase({
      name: 'Invalid branch failing the step execution',
      branchName: 'invalid-prefix/my-cool-feature',
      failOnInvalid: true,
      expectedIsValid: false,
      expectExitCode: 1
    });

    // Case 5: Invalid prefix with failOnInvalid = false (should NOT fail process)
    runTestCase({
      name: 'Invalid branch passing the step execution',
      branchName: 'custom-prefix/my-branch',
      failOnInvalid: false,
      expectedIsValid: false,
      expectedTag: 'custom-prefix-my-branch',
      expectedType: 'unknown',
      expectExitCode: 0
    });

    // Case 6: Special character replacement, uppercase conversion, and length truncation
    runTestCase({
      name: 'Aesthetic Normalization and Truncation',
      branchName: 'feature/JIRA-12345_very_long-name-with-slashes/and$special#chars',
      maxLength: 30,
      expectedIsValid: true,
      expectedTag: 'feature-jira-12345-very-long', // Truncated to 30 and cleaned
      expectedType: 'feature',
      expectExitCode: 0
    });

    // Case 7: Trailing separator cleanup after length truncation
    runTestCase({
      name: 'Truncation trailing separator cleanup',
      branchName: 'feature/JIRA-123-ab', // normalizes to feature-jira-123-ab
      maxLength: 13, // Truncation point: "feature-jira-" (ends with -)
      expectedIsValid: true,
      expectedTag: 'feature-jira', // must trim the trailing dash
      expectedType: 'feature',
      expectExitCode: 0
    });

    console.log('\n========================================');
    console.log('ALL LOCAL TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } finally {
    // Clean up temporary output file
    if (fs.existsSync(TEMP_OUTPUT_FILE)) {
      fs.unlinkSync(TEMP_OUTPUT_FILE);
    }
  }
}

runAll();
