// See: https://typicode.github.io/husky/how-to.html#ci-server-and-docker
import ci from 'ci-info';

// Do not initialize Husky in CI environments.
if (ci.isCI) {
    console.log('Skipping Husky initialization, because we detected a CI environment:', ci.name);
    process.exit(0);
}

// Initialize Husky programmatically.
const husky = (await import('husky')).default;
console.log(husky());
