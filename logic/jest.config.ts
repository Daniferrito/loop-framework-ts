import type {Config} from 'jest';

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["jest-expect-message"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  moduleFileExtensions: ["js", "ts", "csv", "json"],
};

export default config;