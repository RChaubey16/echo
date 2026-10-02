-- Separate database for integration and E2E tests, so test resets never wipe dev data.
CREATE DATABASE echo_test OWNER echo;
