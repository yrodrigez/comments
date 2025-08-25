export default {
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts'],
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true
        }],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@domain/(.*)\\.js$': '<rootDir>/src/domain/$1',
        '^@domain/(.*)$': '<rootDir>/src/domain/$1',
        '^@application/(.*)\\.js$': '<rootDir>/src/application/$1',
        '^@application/(.*)$': '<rootDir>/src/application/$1',
        '^@infrastructure/(.*)\\.js$': '<rootDir>/src/infrastructure/$1',
        '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@services/(.*)\\.js$': '<rootDir>/src/services/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@shared/(.*)\\.js$': '<rootDir>/src/shared/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))'
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
    ],
};
