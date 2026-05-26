const fs = require('fs');

/**
 * Main execution function for the custom action.
 */
function run() {
  try {
    // 1. Retrieve inputs from environment variables
    const rawBranchName = process.env.INPUT_BRANCH_NAME || process.env['INPUT_BRANCH-NAME'] || '';
    const rawAllowedPrefixes = process.env.INPUT_ALLOWED_PREFIXES || process.env['INPUT_ALLOWED-PREFIXES'] || 'feature/,bugfix/,hotfix/,release/,main,master,develop';
    const rawMaxLength = process.env.INPUT_MAX_LENGTH || process.env['INPUT_MAX-LENGTH'] || '50';
    const rawFailOnInvalid = process.env.INPUT_FAIL_ON_INVALID || process.env['INPUT_FAIL-ON-INVALID'] || 'true';

    console.log('=== Branch & Tag Normalizer ===');
    console.log(`Input Branch Name    : "${rawBranchName}"`);
    console.log(`Allowed Prefixes     : "${rawAllowedPrefixes}"`);
    console.log(`Max Length limit     : "${rawMaxLength}"`);
    console.log(`Fail on Invalid flag : "${rawFailOnInvalid}"`);

    // 2. Validate input presence
    if (!rawBranchName || rawBranchName.trim() === '') {
      throw new Error('Input "branch-name" is required and cannot be empty.');
    }

    // 3. Process branch name
    // Strip standard Git references prefixes if present
    let branchName = rawBranchName.trim();
    if (branchName.startsWith('refs/heads/')) {
      branchName = branchName.substring('refs/heads/'.length);
    } else if (branchName.startsWith('refs/tags/')) {
      branchName = branchName.substring('refs/tags/'.length);
    } else if (branchName.startsWith('refs/pull/')) {
      // e.g. refs/pull/123/merge -> pull-123-merge
      branchName = branchName.substring('refs/'.length);
    }

    console.log(`Cleaned Branch Name  : "${branchName}"`);

    // Parse allowed prefixes / names
    const allowedPatterns = rawAllowedPrefixes
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // 4. Validate against allowed prefixes & categorize branch type
    let isValid = false;
    let branchType = 'unknown';
    let validationMessage = '';

    if (allowedPatterns.length === 0) {
      isValid = true;
      branchType = 'any';
      validationMessage = 'Validation skipped: allowed-prefixes input was empty.';
    } else {
      for (const pattern of allowedPatterns) {
        if (pattern.endsWith('/')) {
          // It is a prefix (e.g. 'feature/')
          if (branchName.startsWith(pattern) && branchName.length > pattern.length) {
            isValid = true;
            branchType = pattern.slice(0, -1); // strip the trailing '/'
            break;
          }
        } else {
          // Exact branch match (e.g. 'main', 'develop')
          if (branchName === pattern) {
            isValid = true;
            branchType = pattern;
            break;
          }
        }
      }

      if (isValid) {
        validationMessage = `Branch name complies with naming conventions. Category: "${branchType}".`;
      } else {
        validationMessage = `Branch name "${branchName}" does not match any allowed prefix/name: [${allowedPatterns.join(', ')}].`;
      }
    }

    // 5. Generate normalized tag (Docker and Git compatible)
    // Rules:
    // - Convert to lowercase
    // - Replace non-alphanumeric, non-dot, non-hyphen chars with hyphens
    // - Replace consecutive hyphens/dots with a single char
    // - Remove leading/trailing hyphens/dots
    // - Truncate to max-length
    let normalized = branchName.toLowerCase();
    
    // Replace disallowed characters
    normalized = normalized.replace(/[^a-z0-9.-]/g, '-');
    
    // Consolidate hyphens and dots
    normalized = normalized.replace(/-+/g, '-');
    normalized = normalized.replace(/\.+/g, '.');
    
    // Clean up edges
    normalized = normalized.replace(/^[-.]+/, '');
    normalized = normalized.replace(/[-.]+$/, '');

    // Enforce max length
    const maxLength = parseInt(rawMaxLength, 10) || 50;
    if (normalized.length > maxLength) {
      normalized = normalized.substring(0, maxLength);
      // Ensure trailing edge is clean after truncation
      normalized = normalized.replace(/[-.]+$/, '');
    }

    // Ensure we don't return an empty tag if everything got cleaned out
    if (normalized.length === 0) {
      normalized = 'default-tag';
    }

    console.log(`\n=== Processing Results ===`);
    console.log(`Is Valid           : ${isValid}`);
    console.log(`Branch Type        : ${branchType}`);
    console.log(`Normalized Tag     : "${normalized}"`);
    console.log(`Validation Message : ${validationMessage}\n`);

    // 6. Write outputs to GITHUB_OUTPUT environment file
    const outputs = {
      'is-valid': String(isValid),
      'normalized-tag': normalized,
      'branch-type': branchType,
      'validation-message': validationMessage
    };

    const outputFilePath = process.env.GITHUB_OUTPUT;
    if (outputFilePath) {
      console.log(`Saving outputs to: ${outputFilePath}`);
      for (const [key, value] of Object.entries(outputs)) {
        fs.appendFileSync(outputFilePath, `${key}=${value}\n`);
      }
      console.log('Outputs successfully saved.');
    } else {
      console.log('Note: GITHUB_OUTPUT environment variable is not set. Simulating outputs:');
      console.log(JSON.stringify(outputs, null, 2));
    }

    // 7. Fail build if branch is invalid and fail-on-invalid is enabled
    if (!isValid && rawFailOnInvalid.toLowerCase() === 'true') {
      console.log(`::error::Branch validation failed: ${validationMessage}`);
      process.exitCode = 1;
    }

  } catch (error) {
    console.log(`::error::Action error: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
